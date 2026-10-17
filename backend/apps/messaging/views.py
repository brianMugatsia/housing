from django.db.models import Q
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from .models import Message
from .serializers import MessageSerializer


class MessageListCreateView(generics.ListCreateAPIView):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        other_user_id = self.request.query_params.get("user_id")
        qs = Message.objects.filter(Q(sender=user) | Q(recipient=user))
        if other_user_id:
            qs = qs.filter(
                Q(sender_id=other_user_id) | Q(recipient_id=other_user_id)
            )
        return qs.select_related("sender", "recipient", "property")

    def perform_create(self, serializer):
        serializer.save(sender=self.request.user)


class ConversationListView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        sent_to = Message.objects.filter(sender=user).values_list(
            "recipient", flat=True
        )
        received_from = Message.objects.filter(recipient=user).values_list(
            "sender", flat=True
        )
        user_ids = set(list(sent_to) + list(received_from))

        from apps.accounts.models import User

        users = User.objects.filter(id__in=user_ids)
        data = []
        for u in users:
            last_msg = (
                Message.objects.filter(
                    (Q(sender=user) & Q(recipient=u))
                    | (Q(sender=u) & Q(recipient=user))
                )
                .order_by("-created_at")
                .first()
            )
            data.append(
                {
                    "user_id": u.id,
                    "full_name": u.full_name,
                    "role": u.role,
                    "last_message": MessageSerializer(last_msg).data
                    if last_msg
                    else None,
                }
            )
        return Response(data)
