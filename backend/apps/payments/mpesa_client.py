import base64
import requests
from datetime import datetime
from requests.auth import HTTPBasicAuth
from django.conf import settings


class MpesaClient:
    def __init__(self):
        self.consumer_key = (getattr(settings, "MPESA_CONSUMER_KEY", "") or "").strip()
        self.consumer_secret = (getattr(settings, "MPESA_CONSUMER_SECRET", "") or "").strip()
        self.shortcode = (getattr(settings, "MPESA_SHORTCODE", "174379") or "").strip()
        self.store_number = (getattr(settings, "MPESA_STORE_NUMBER", "") or self.shortcode).strip()
        self.till_number = (getattr(settings, "MPESA_TILL_NUMBER", "") or self.shortcode).strip()
        self.passkey = (getattr(settings, "MPESA_PASSKEY", "") or "").strip()
        self.callback_url = (getattr(settings, "MPESA_CALLBACK_URL", "") or "").strip()
        self.transaction_type = (getattr(settings, "MPESA_TRANSACTION_TYPE", "CustomerBuyGoodsOnline") or "").strip()

        base_url = getattr(settings, "MPESA_BASE_URL", "https://sandbox.safaricom.co.ke")
        self.auth_url = f"{base_url}/oauth/v1/generate?grant_type=client_credentials"
        self.stk_push_url = f"{base_url}/mpesa/stkpush/v1/processrequest"
        self.stk_push_query_url = f"{base_url}/mpesa/stkpushquery/v1/query"
        self.transaction_status_url = f"{base_url}/mpesa/transactionstatus/v1/query"
        self.reversal_url = f"{base_url}/mpesa/reversal/v1/request"
        self.account_balance_url = f"{base_url}/mpesa/accountbalance/v1/query"
        self.b2c_url = f"{base_url}/mpesa/b2c/v1/paymentrequest"

    def get_access_token(self):
        try:
            response = requests.get(
                self.auth_url,
                auth=HTTPBasicAuth(self.consumer_key, self.consumer_secret),
                headers={"Accept": "application/json"}
            )

            # Print full Daraja error details
            if response.status_code != 200:
                print("=" * 50)
                print(f"DARAJA STATUS: {response.status_code}")
                print(f"DARAJA BODY: {response.text}")
                print(f"KEY USED: '{self.consumer_key}'")
                print("=" * 50)

            response.raise_for_status()
            return response.json().get("access_token")

        except requests.exceptions.RequestException as e:
            print(f"Failed to generate M-Pesa access token: {e}")
            raise

    def stk_push(self, phone_number, amount, account_reference, transaction_desc):
        access_token = self.get_access_token()

        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        is_buygoods = self.transaction_type == "CustomerBuyGoodsOnline"
        business_shortcode = self.store_number if is_buygoods else self.shortcode
        party_b = self.till_number if is_buygoods else self.shortcode

        password_str = f"{business_shortcode}{self.passkey}{timestamp}"
        password = base64.b64encode(password_str.encode("utf-8")).decode("utf-8")

        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
        }

        payload = {
            "BusinessShortCode": business_shortcode,
            "Password": password,
            "Timestamp": timestamp,
            "TransactionType": self.transaction_type,
            "Amount": int(amount),
            "PartyA": phone_number,
            "PartyB": party_b,
            "PhoneNumber": phone_number,
            "CallBackURL": self.callback_url,
            "AccountReference": account_reference,
            "TransactionDesc": transaction_desc,
        }

        response = requests.post(self.stk_push_url, json=payload, headers=headers)

        if response.status_code != 200:
            print(f"Daraja STK Push Error Response: {response.text}")

        response.raise_for_status()
        return response.json()

    def stk_push_query(self, checkout_request_id):
        access_token = self.get_access_token()
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        is_buygoods = self.transaction_type == "CustomerBuyGoodsOnline"
        business_shortcode = self.store_number if is_buygoods else self.shortcode

        password_str = f"{business_shortcode}{self.passkey}{timestamp}"
        password = base64.b64encode(password_str.encode("utf-8")).decode("utf-8")

        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
        }
        payload = {
            "BusinessShortCode": business_shortcode,
            "Password": password,
            "Timestamp": timestamp,
            "CheckoutRequestID": checkout_request_id,
        }
        response = requests.post(self.stk_push_query_url, json=payload, headers=headers)
        if response.status_code != 200:
            print(f"Daraja STK Push Query Error Response: {response.text}")
        response.raise_for_status()
        return response.json()

    def transaction_status(self, transaction_id, initiator, security_credential, result_url, queue_timeout_url, remarks="Transaction Status Query"):
        access_token = self.get_access_token()
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
        }
        payload = {
            "Initiator": initiator,
            "SecurityCredential": security_credential,
            "CommandID": "TransactionStatusQuery",
            "TransactionID": transaction_id,
            "PartyA": self.shortcode,
            "IdentifierType": "4",
            "ResultURL": result_url,
            "QueueTimeoutURL": queue_timeout_url,
            "Remarks": remarks,
            "Occasion": "StatusQuery"
        }
        response = requests.post(self.transaction_status_url, json=payload, headers=headers)
        if response.status_code != 200:
            print(f"Daraja Transaction Status Error Response: {response.text}")
        response.raise_for_status()
        return response.json()

    def reversal(self, transaction_id, amount, receiver_party, result_url, queue_timeout_url, initiator, security_credential, remarks="Reversal", occasion="Reversal"):
        access_token = self.get_access_token()
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
        }
        payload = {
            "Initiator": initiator,
            "SecurityCredential": security_credential,
            "CommandID": "TransactionReversal",
            "TransactionID": transaction_id,
            "Amount": str(amount),
            "ReceiverParty": receiver_party,
            "ReceiverIdentifierType": "11",
            "ResultURL": result_url,
            "QueueTimeoutURL": queue_timeout_url,
            "Remarks": remarks,
            "Occasion": occasion
        }
        response = requests.post(self.reversal_url, json=payload, headers=headers)
        if response.status_code != 200:
            print(f"Daraja Reversal Error Response: {response.text}")       
        response.raise_for_status()
        return response.json()

    def b2c_payment(self, phone_number, amount, remarks="Booking Refund 95pct", occasion="Refund"):
        access_token = self.get_access_token()
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
        }
        initiator_name = getattr(settings, "MPESA_INITIATOR_NAME", "testinitiator")
        security_credential = getattr(settings, "MPESA_SECURITY_CREDENTIAL", "")

        payload = {
            "InitiatorName": initiator_name,
            "SecurityCredential": security_credential,
            "CommandID": "BusinessPayment",
            "Amount": int(amount),
            "PartyA": self.shortcode,
            "PartyB": phone_number,
            "Remarks": remarks,
            "QueueTimeoutURL": self.callback_url,
            "ResultURL": self.callback_url,
            "Occasion": occasion,
        }
        response = requests.post(self.b2c_url, json=payload, headers=headers)
        if response.status_code != 200:
            print(f"Daraja B2C Error Response: {response.text}")
        response.raise_for_status()
        return response.json()

    def account_balance(self, initiator, security_credential, result_url, queue_timeout_url, remarks="Account Balance Query"):
        access_token = self.get_access_token()
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
        }
        payload = {
            "Initiator": initiator,
            "SecurityCredential": security_credential,
            "CommandID": "AccountBalance",
            "PartyA": self.shortcode,
            "IdentifierType": "4",
            "Remarks": remarks,
            "ResultURL": result_url,
            "QueueTimeoutURL": queue_timeout_url,
        }
        response = requests.post(self.account_balance_url, json=payload, headers=headers)
        if response.status_code != 200:
            print(f"Daraja Account Balance Error Response: {response.text}")
        response.raise_for_status()
        return response.json()
