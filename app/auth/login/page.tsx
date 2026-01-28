import { redirect } from 'next/navigation';

// Login = Signup for wallet auth, just redirect
export default function LoginPage() {
  redirect('/auth/signup');
}
