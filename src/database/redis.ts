import { Redis } from '@upstash/redis'

const token = import.meta.env.VITE_REDIS_TOKEN
console.log(token)

const redis = new Redis({
  url: 'https://hip-shark-20073.upstash.io',
  token
})

export { redis }
