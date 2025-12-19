import { useState } from 'react'
import './App.css'
import Tabs from './components/Tabs'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './api/query-client'

function App() {
  const [count, setCount] = useState(0)

  return (
    <QueryClientProvider client={queryClient}>
    <Tabs />
  </QueryClientProvider>
  )
}

export default App
