import { useEffect, useMemo, useState } from 'react'

type RemoteModule = {
  behavior?: {
    name: string
    title: string
    component: React.ComponentType<{ text?: string }>
  }
}

export default function App() {
  const params = useMemo(() => new URLSearchParams(window.location.search), [])
  const remoteHost = params.get('host') || 'http://localhost:5173'

  const [RemoteComp, setRemoteComp] =
    useState<React.ComponentType<{ text?: string }> | null>(null)
  const [behaviorJson, setBehaviorJson] = useState<any>(null)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    let cancelled = false

    async function loadRemote() {
      try {
        setError('')

        await import(/* @vite-ignore */ `${remoteHost}/@vite/client`)

        const mod = (await import(
          /* @vite-ignore */ `${remoteHost}/src/widget.tsx`
        )) as RemoteModule

        const json = await fetch(`${remoteHost}/behaviors.json`).then((r) =>
          r.json(),
        )

        if (cancelled) return

        setRemoteComp(() => mod.behavior?.component ?? null)
        setBehaviorJson(json)
      } catch (e) {
        if (cancelled) return
        setError(e instanceof Error ? e.message : String(e))
      }
    }

    loadRemote()

    return () => {
      cancelled = true
    }
  }, [remoteHost])

  return (
    <div style={{ padding: 24, fontFamily: 'sans-serif' }}>
      <h1>Host App</h1>
      <p>remoteHost: {remoteHost}</p>

      <h2>behaviors.json</h2>
      <pre>{JSON.stringify(behaviorJson, null, 2)}</pre>

      <h2>remote component</h2>
      {RemoteComp ? <RemoteComp text="Hello from host-app" /> : <div>loading...</div>}

      {error ? (
        <>
          <h2>error</h2>
          <pre style={{ color: 'red' }}>{error}</pre>
        </>
      ) : null}
    </div>
  )
}
