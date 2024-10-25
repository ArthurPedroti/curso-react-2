import { FormEvent, useState } from 'react'
import { Button } from './components/ui/button'
import { Input } from './components/ui/input'
import { Label } from './components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from './components/ui/select'
import dayjs, { ManipulateType } from 'dayjs'
import weekOfYear from 'dayjs/plugin/weekOfYear'
import goldQuotations from './assets/goldBRL.json'
import { cn } from './lib/utils'
import axios from 'axios'
import { redis } from './database/redis'

type Quotation = {
  code: string
  codein: string
  name: string
  high: string
  low: string
  varBid: string
  pctChange: string
  bid: string
  ask: string
  timestamp: string
  create_date: string
}

export function Form() {
  const [quantity, setQuantity] = useState(0)
  const [measure, setMeasure] = useState<ManipulateType>('year')
  const [size, setSize] = useState('12')
  const [loss, setLoss] = useState(0)
  dayjs.extend(weekOfYear)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const onceWeight = 31.1035
    // const today = dayjs()
    const quotationDay = dayjs().subtract(quantity, measure)
    const quotations = goldQuotations.map((quote) => {
      const formattedDate = dayjs(quote.date.split('.').reverse().join('-'))

      return {
        ...quote,
        formattedDate,
        week: formattedDate.week(),
        year: formattedDate.year()
      }
    })

    const quotation = quotations.find(
      (quote) =>
        quote.year === quotationDay.year() && quote.week === quotationDay.week()
    )
    // const quotationToday = quotations.find(
    //   (quote) => quote.year === today.year() && quote.week === today.week()
    // )

    const goldQuoteKey = `XAU-USD-${dayjs().format('YYYY-MM-DD')}`
    let goldQuote = await redis.get<Quotation>(goldQuoteKey)

    if (!goldQuote) {
      const goldQuoteData = await axios.get(
        'https://economia.awesomeapi.com.br/json/daily/XAU-USD'
      )
      goldQuote = goldQuoteData.data[0]
      await redis.set(goldQuoteKey, goldQuoteData.data[0])
    }

    const usdQuoteKey = `USD-BRL-${dayjs().format('YYYY-MM-DD')}`
    let usdQuote = await redis.get<Quotation>(usdQuoteKey)

    if (!usdQuote) {
      const usdQuoteData = await axios.get(
        'https://economia.awesomeapi.com.br/json/daily/USD-BRL'
      )
      usdQuote = usdQuoteData.data[0]
      await redis.set(usdQuoteKey, usdQuoteData.data[0])
    }

    if (quotation && goldQuote && usdQuote) {
      const goldBrlToday = Number(goldQuote.bid) * Number(usdQuote.bid)
      console.log(goldBrlToday)

      const quotationDiff = goldBrlToday - quotation?.goldBRL
      const valuePerGram = quotationDiff / onceWeight
      const loss = valuePerGram * Number(size)
      setLoss(loss)
    }
  }

  return (
    <div className="flex flex-col items-center">
      <p className="text-2xl font-medium my-8">
        A quanto tempo voce está enrolando sua namorada(o)?
      </p>
      <form
        onSubmit={handleSubmit}
        className="flex min-w-72 flex-col gap-2 m-auto"
      >
        <div className="flex flex-col gap-2">
          <Label>Quantidade</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              value={quantity}
              onChange={(value) => setQuantity(Number(value.target.value))}
            />
            <Select
              value={measure}
              onValueChange={(value: ManipulateType) => {
                setMeasure(value)
              }}
            >
              <SelectTrigger className="max-w-24">
                <SelectValue placeholder="Medida" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="year">Anos</SelectItem>
                <SelectItem value="month">Meses</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Tamanho da aliança</Label>

            <Select
              value={size}
              onValueChange={(value: string) => {
                setSize(value)
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tamanho" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="6">Fininha (sou humilde)</SelectItem>
                <SelectItem value="12">Média (sou normal)</SelectItem>
                <SelectItem value="18">Grossa (sou patrão)</SelectItem>
                <SelectItem value="24">Gigante (sou gangster)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button>Calcular</Button>
      </form>

      {loss ? (
        <p
          className={cn([
            'text-xl font-medium my-8',
            loss > 0 ? 'text-red-500' : 'text-emerald-500'
          ])}
        >
          Você já {loss > 0 ? 'perdeu' : 'ganhou'}{' '}
          {loss.toLocaleString('pt-br', {
            style: 'currency',
            currency: 'BRL'
          })}{' '}
          por enrolar sua namorada(o)!
        </p>
      ) : null}
    </div>
  )
}
