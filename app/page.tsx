"use client"

import { setupBigFlow } from "@/firebase/feCallables"
import { uuidv4 } from "@firebase/util"
import Link from "next/link"
import { useAuthState } from "react-firebase-hooks/auth"
import { initFb } from "@/firebase/initFb"
import {
  getAuth,
  onAuthStateChanged,
  signInAnonymously,
  User,
} from "@firebase/auth"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

const LoadingButton = ({
  onClick,
  children,
  className,
}: {
  onClick: () => Promise<void>
  children: React.ReactNode
  className?: string
}) => {
  const [loading, setLoading] = useState(false)

  return (
    <div
      className={cn(
        "cursor-pointer rounded-lg bg-gray-800 px-6 py-3 font-medium text-white transition-colors hover:bg-gray-700",
        className
      )}
      onClick={async () => {
        setLoading(true)
        await onClick()
      }}
    >
      {loading ? "Loading..." : children}
    </div>
  )
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    initFb()
    const auth = getAuth()
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser)
        setLoading(false)
      } else {
        signInAnonymously(auth)
          .then((userCredential) => {
            setUser(userCredential.user)
            setLoading(false)
          })
          .catch((error) => {
            console.error("Error signing in anonymously:", error)
            setLoading(false)
          })
      }
    })

    return () => unsubscribe()
  }, [])

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="max-w-3xl space-y-8 text-center">
        <h1 className="text-5xl font-bold text-gray-800">CurtainCall.AI</h1>

        <p className="text-xl text-gray-600">
          Create powerful, personalized immersive theatre experiences powered by
          artificial intelligence
        </p>

        <div className="flex flex-col gap-8">
          <p className="text-gray-600">
            Design unique journeys that adapt to each participant, combining
            AI-driven narratives with immersive audio for unforgettable
            theatrical experiences.
          </p>

          <div className="mb-12 mt-8 flex justify-center gap-4">
            <LoadingButton
              onClick={async () => {
                if (user) {
                  await setupBigFlow({ flowId: user.uid })
                  router.push(`/flow/${user.uid}`)
                }
              }}
            >
              Configure Sample Experience
            </LoadingButton>
            <LoadingButton
              onClick={async () => {
                if (user) {
                  await setupBigFlow({ flowId: user.uid })
                  router.push(`/start/${user.uid}`)
                }
              }}
              className="rounded-lg bg-white px-6 py-3 font-medium text-gray-900 transition-colors hover:bg-gray-100"
            >
              Try It Now
            </LoadingButton>
          </div>

          <div>
            Reach out to{" "}
            <Link
              href="mailto:runnedrun@gmail.com"
              className="text-blue-400 underline"
            >
              David
            </Link>{" "}
            if you want help making your own experience
          </div>
        </div>
      </div>
    </main>
  )
}
