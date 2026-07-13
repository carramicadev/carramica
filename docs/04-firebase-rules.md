# Firebase Rules

Never recreate Firebase.

Reuse the existing Firebase project.

Keep:

- Firestore
- Authentication
- Storage

Do not rename collections.

Do not change document structures unless instructed.

Initialize Firebase only once.

Create

lib/firebase/

Move all Firebase logic into services.

Never call Firestore directly inside UI components.

Always use services.