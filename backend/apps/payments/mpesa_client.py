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
        self.passkey = (getattr(settings, "MPESA_PASSKEY", "") or "").strip()
        self.callback_url = (getattr(settings, "MPESA_CALLBACK_URL", "") or "").strip()
        
        base_url = getattr(settings, "MPESA_BASE_URL", "https://sandbox.safaricom.co.ke")
        self.auth_url = f"{base_url}/oauth/v1/generate?grant_type=client_credentials"
        self.stk_push_url = f"{base_url}/mpesa/stkpush/v1/processrequest"

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
        password_str = f"{self.shortcode}{self.passkey}{timestamp}"
        password = base64.b64encode(password_str.encode("utf-8")).decode("utf-8")

        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
        }

        payload = {
            "BusinessShortCode": self.shortcode,
            "Password": password,
            "Timestamp": timestamp,
            "TransactionType": "CustomerPayBillOnline",
            "Amount": int(amount),
            "PartyA": phone_number,
            "PartyB": self.shortcode,
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