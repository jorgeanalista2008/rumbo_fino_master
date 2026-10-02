export const MAPBOX_TOKEN =
  process.env.NEXT_PUBLIC_MAPBOX_TOKEN ||
  (typeof window !== 'undefined'
    ? window.atob('cGsuZXlKMUlqb2lhbTl5WjJWaGJtRnNhWE4wWVRJd01EZ2lMQ0poSWpvaVkyMTFiMm8yY0dJNE1EQjVaek13YjJ4eWQzUTVOWFY1YWlKOS5LXy1DUVBaRDdsVmY5YkJISVM2dWVn')
    : Buffer.from(
        'cGsuZXlKMUlqb2lhbTl5WjJWaGJtRnNhWE4wWVRJd01EZ2lMQ0poSWpvaVkyMTFiMm8yY0dJNE1EQjVaek13YjJ4eWQzUTVOWFY1YWlKOS5LXy1DUVBaRDdsVmY5YkJISVM2dWVn',
        'base64'
      ).toString('utf-8'));
