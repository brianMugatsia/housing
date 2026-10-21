import random
from datetime import timedelta
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db import transaction

from apps.accounts.models import User
from apps.properties.models import University, Amenity, Property, PropertyImage
from apps.bookings.models import Booking
from apps.payments.models import Payment, LandlordPayout
from apps.maintenance.models import MaintenanceTicket
from apps.messaging.models import Message


class Command(BaseCommand):
    help = "Clears all data except user accounts and seeds realistic system data."

    def handle(self, *args, **options):
        self.stdout.write("Clearing transactional and catalog data (preserving user accounts)...")

        with transaction.atomic():
            # Delete in reverse order of dependencies
            LandlordPayout.objects.all().delete()
            Payment.objects.all().delete()
            MaintenanceTicket.objects.all().delete()
            Message.objects.all().delete()
            Booking.objects.all().delete()
            PropertyImage.objects.all().delete()
            Property.objects.all().delete()
            Amenity.objects.all().delete()
            University.objects.all().delete()

        self.stdout.write(self.style.SUCCESS("All transactional data cleared successfully. Starting seeding..."))

        with transaction.atomic():
            # 1. Seed Universities
            unis_data = [
                {"name": "University of Nairobi", "location": "Main Campus, Nairobi", "county": "Nairobi"},
                {"name": "Kenyatta University", "location": "Kahawa, Nairobi", "county": "Nairobi"},
                {"name": "Strathmore University", "location": "Madaraka, Nairobi", "county": "Nairobi"},
                {"name": "JKUAT", "location": "Juja, Kiambu", "county": "Kiambu"},
            ]
            unis = [University.objects.create(**u) for u in unis_data]
            self.stdout.write(f"Seeded {len(unis)} universities.")

            # 2. Seed Amenities
            amenity_names = [
                "Wi-Fi", "Water", "Electricity", "Parking", "Security",
                "Kitchen", "Laundry", "Furnished", "Study area", "CCTV", "Backup Generator"
            ]
            amenities = [Amenity.objects.create(name=name) for name in amenity_names]
            self.stdout.write(f"Seeded {len(amenities)} amenities.")

            # 3. Ensure Landlord and Student users exist
            landlords = User.objects.filter(role="LANDLORD")
            if not landlords.exists():
                landlord = User.objects.create_user(
                    email="landlord@studenthouse.com",
                    full_name="Jane Wanjiku (Landlord)",
                    role="LANDLORD",
                    phone="254711223344",
                    password="password123"
                )
                landlords = User.objects.filter(role="LANDLORD")
            else:
                landlord = landlords.first()

            students = User.objects.filter(role="STUDENT")
            if not students.exists():
                student1 = User.objects.create_user(
                    email="student1@studenthouse.com",
                    full_name="Alex Kiprop (Student)",
                    role="STUDENT",
                    phone="254799887766",
                    password="password123"
                )
                student2 = User.objects.create_user(
                    email="student2@studenthouse.com",
                    full_name="Amina Ouma (Student)",
                    role="STUDENT",
                    phone="254755443322",
                    password="password123"
                )
                students = User.objects.filter(role="STUDENT")

            # 4. Seed Properties
            properties_data = [
                {
                    "title": "Summit View Student Hostels",
                    "description": "Modern executive student apartments featuring high-speed Wi-Fi, 24/7 security, backup generator, and study desks.",
                    "property_type": "HOSTEL",
                    "semester_rent": Decimal("38000.00"),
                    "deposit": Decimal("10000.00"),
                    "total_rooms": 12,
                    "available_rooms": 4,
                    "available_room_numbers": ["A1", "A2", "B3", "C2"],
                    "town": "Nairobi",
                    "county": "Nairobi",
                    "address": "University Way, near Main Campus",
                    "latitude": -1.2833,
                    "longitude": 36.8167,
                    "verification_status": "APPROVED",
                    "deposit_percentage": 30,
                },
                {
                    "title": "Acacia Heights Bedsitters",
                    "description": "Spacious self-contained bedsitters with private kitchenette, constant hot water, and secure parking.",
                    "property_type": "BEDSITTER",
                    "semester_rent": Decimal("30000.00"),
                    "deposit": Decimal("8000.00"),
                    "total_rooms": 8,
                    "available_rooms": 3,
                    "available_room_numbers": ["101", "104", "202"],
                    "town": "Kahawa",
                    "county": "Nairobi",
                    "address": "Kahawa Sukari, near Kenyatta University",
                    "latitude": -1.1856,
                    "longitude": 36.9256,
                    "verification_status": "APPROVED",
                    "deposit_percentage": 25,
                },
                {
                    "title": "Madaraka Premier Apartments",
                    "description": "Luxury 1-bedroom apartments tailored for students and young professionals seeking quiet, upscale living.",
                    "property_type": "ONE_BEDROOM",
                    "semester_rent": Decimal("65000.00"),
                    "deposit": Decimal("15000.00"),
                    "total_rooms": 10,
                    "available_rooms": 5,
                    "available_room_numbers": ["M1", "M2", "M3", "M4", "M5"],
                    "town": "Nairobi",
                    "county": "Nairobi",
                    "address": "Madaraka Estate, near Strathmore University",
                    "latitude": -1.3056,
                    "longitude": 36.8219,
                    "verification_status": "APPROVED",
                    "deposit_percentage": 50,
                },
            ]

            created_properties = []
            for i, p_data in enumerate(properties_data):
                prop = Property.objects.create(
                    landlord=landlord,
                    university=unis[i % len(unis)],
                    **p_data
                )
                prop.amenities.set(random.sample(amenities, k=min(6, len(amenities))))
                
                # Add sample property images
                PropertyImage.objects.create(
                    property=prop,
                    image="https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&q=80&w=1000",
                    is_primary=True
                )
                PropertyImage.objects.create(
                    property=prop,
                    image="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=1000",
                    is_primary=False
                )
                created_properties.append(prop)

            self.stdout.write(f"Seeded {len(created_properties)} properties with images and amenities.")

            # 5. Seed Bookings
            bookings = []
            student_list = list(students)
            for idx, prop in enumerate(created_properties):
                if student_list:
                    st = student_list[idx % len(student_list)]
                    booking = Booking.objects.create(
                        property=prop,
                        student=st,
                        move_in_date=timezone.now().date() + timedelta(days=5 * (idx + 1)),
                        duration_semesters=random.choice([1, 2]),
                        house_number=prop.available_room_numbers[0] if prop.available_room_numbers else "101",
                        status="CONFIRMED" if idx == 0 else ("APPROVED" if idx == 1 else "PENDING"),
                        notes="Looking forward to moving in for the upcoming semester.",
                        lease_signed_at=timezone.now() if idx == 0 else None,
                        landlord_signature="Jane Wanjiku" if idx == 0 else "",
                        tenant_signature=st.full_name if idx == 0 else "",
                    )
                    bookings.append(booking)

            self.stdout.write(f"Seeded {len(bookings)} bookings.")

            # 6. Seed Payments & Landlord Payouts
            for booking in bookings:
                if booking.status in ["CONFIRMED", "APPROVED"]:
                    rent_amount = booking.property.semester_rent * booking.duration_semesters
                    payment = Payment.objects.create(
                        booking=booking,
                        student=booking.student,
                        phase="RENT",
                        amount=rent_amount,
                        phone_number=booking.student.phone or "254712345678",
                        status="COMPLETED" if booking.status == "CONFIRMED" else "PENDING",
                        mpesa_receipt_number=f"SGH{random.randint(100000, 999999)}K" if booking.status == "CONFIRMED" else "",
                        result_code=0 if booking.status == "CONFIRMED" else None,
                        result_desc="The service request is processed successfully." if booking.status == "CONFIRMED" else "",
                        transaction_date=timezone.now() if booking.status == "CONFIRMED" else None,
                    )

                    # If confirmed, create a landlord payout record reflecting 93% net entitlement
                    if booking.status == "CONFIRMED":
                        net_payout = (rent_amount * Decimal("0.93")).quantize(Decimal("0.01"))
                        LandlordPayout.objects.create(
                            landlord=booking.property.landlord,
                            property=booking.property,
                            amount=net_payout,
                            phone_number=booking.property.landlord.phone or "254711223344",
                            status="COMPLETED",
                            mpesa_receipt_number=f"B2C{random.randint(100000, 999999)}K",
                            conversation_id=f"AG_{random.randint(10000,99999)}",
                            originator_conversation_id=f"OG_{random.randint(10000,99999)}",
                            result_desc="B2C Payout completed successfully."
                        )

            self.stdout.write("Seeded payments and landlord B2C payout records.")

            # 7. Seed Maintenance Tickets
            if bookings:
                MaintenanceTicket.objects.create(
                    property=created_properties[0],
                    student=bookings[0].student,
                    title="Kitchen Sink Plumbing",
                    description="The kitchen sink faucet is dripping constantly. Kindly arrange for a plumber.",
                    category="PLUMBING",
                    priority="MEDIUM",
                    status="IN_PROGRESS"
                )
                MaintenanceTicket.objects.create(
                    property=created_properties[1] if len(created_properties) > 1 else created_properties[0],
                    student=students[0],
                    title="Wi-Fi Router Reset",
                    description="Internet connection in unit 104 has intermittent signal drops.",
                    category="WIFI",
                    priority="LOW",
                    status="SUBMITTED"
                )
                self.stdout.write("Seeded maintenance tickets.")

            # 8. Seed Messaging / Conversations
            if bookings and student_list:
                st = student_list[0]
                Message.objects.create(
                    sender=st,
                    recipient=landlord,
                    content="Hello! Is parking included in the monthly rent for Summit View?"
                )
                Message.objects.create(
                    sender=landlord,
                    recipient=st,
                    content="Hello Alex! Yes, secure parking is fully included for all verified tenants."
                )
                self.stdout.write("Seeded chat messages.")

        self.stdout.write(self.style.SUCCESS("Database reset and fresh system seeding completed successfully! User accounts preserved."))
