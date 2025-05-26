'use client'

import dynamic from 'next/dynamic'
const ThreeDmolFrame = dynamic(() => import('@/components/3dmol-frame'), { ssr: false })

export default function ThreeDmolFrameClient() {
  return <ThreeDmolFrame />
}