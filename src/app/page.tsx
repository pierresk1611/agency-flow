import { redirect } from 'next/navigation'

export default function Home() {
  // Okamžitý presun na login
  redirect('/login')
}