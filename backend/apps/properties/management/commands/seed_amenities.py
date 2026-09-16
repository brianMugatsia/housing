from django.core.management.base import BaseCommand

from apps.properties.models import Amenity

AMENITIES = [
    "Wi-Fi", "Water", "Electricity", "Parking", "Security",
    "Kitchen", "Laundry", "Furnished", "Study area",
]


class Command(BaseCommand):
    help = "Seed the default set of property amenities."

    def handle(self, *args, **options):
        created = 0
        for name in AMENITIES:
            _, was_created = Amenity.objects.get_or_create(name=name)
            created += int(was_created)
        self.stdout.write(self.style.SUCCESS(f"Amenities ready. {created} newly created."))
