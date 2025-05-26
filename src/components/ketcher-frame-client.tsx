'use client'

import dynamic from 'next/dynamic'
const KetcherFrame = dynamic(() => import('@/components/ketcher-frame'), { ssr: false })

export default function KetcherFrameClient() {
  return <KetcherFrame />
}