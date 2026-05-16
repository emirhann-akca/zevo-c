import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
    return [
        {
            url: 'https://zevooapp.com',
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 1,
        },
        {
            url: 'https://zevooapp.com/chat',
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.8,
        },
        {
            url: 'https://zevooapp.com/gizlilik',
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.5,
        },
        {
            url: 'https://zevooapp.com/kosullar',
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.5,
        },
        {
            url: 'https://zevooapp.com/destek',
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.6,
        },
        {
            url: 'https://zevooapp.com/hesap-silme',
            lastModified: new Date(),
            changeFrequency: 'yearly',
            priority: 0.4,
        },
    ]
}
