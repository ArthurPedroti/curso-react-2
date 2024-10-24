import { ThemeProvider } from './components/theme-provider'
import { Form } from './Form'

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <div className="flex flex-col p-4 max-w-6xl mx-auto gap-2">
        {/* <ModeToggle /> */}

        <div>
          <Form />
        </div>
      </div>
    </ThemeProvider>
  )
}

export default App
