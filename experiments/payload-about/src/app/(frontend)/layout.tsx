import React from 'react'
import './styles.css'

export const metadata = {
  description: 'An editorial page studio prototype for Durga Bari.',
  title: 'About Durga Bari | Page studio prototype',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="en">
      <body>
        <main>{children}</main>
      </body>
    </html>
  )
}
