/** The D&V wax seal face: domed wax, a raised gilded rim and ring, raised letters. */
import { makeCanvas } from './canvas'

export function drawSealArt(size: number) {
  const S = size
  const hc = makeCanvas(S, S)
  const gc = makeCanvas(S, S)
  const h = hc.getContext('2d')!
  const gm = gc.getContext('2d')!
  const dome = h.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2)
  dome.addColorStop(0, '#a8a8a8')
  dome.addColorStop(0.7, '#808080')
  dome.addColorStop(0.84, '#d8d8d8') // raised rim
  dome.addColorStop(0.93, '#909090')
  dome.addColorStop(1, '#303030')
  h.fillStyle = dome
  h.fillRect(0, 0, S, S)
  gm.fillStyle = '#000'
  gm.fillRect(0, 0, S, S)
  const k = S / 512
  for (const ctx of [h, gm]) {
    ctx.fillStyle = '#fff'
    ctx.strokeStyle = '#fff'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = `600 ${172 * k}px "Cormorant Garamond", Georgia, serif`
    ctx.fillText('D', S * 0.33, S * 0.515)
    ctx.fillText('V', S * 0.69, S * 0.515)
    ctx.font = `italic 500 ${112 * k}px "Cormorant Garamond", Georgia, serif`
    ctx.fillText('&', S * 0.51, S * 0.56)
    ctx.lineWidth = 6 * k
    ctx.beginPath()
    ctx.arc(S / 2, S / 2, S * 0.33, 0, Math.PI * 2)
    ctx.stroke()
  }
  gm.lineWidth = 30 * k
  gm.beginPath()
  gm.arc(S / 2, S / 2, S * 0.43, 0, Math.PI * 2)
  gm.stroke()
  // a ring of tiny gilt dots between the rings
  for (let i = 0; i < 48; i++) {
    const a = (i / 48) * Math.PI * 2
    for (const ctx of [h, gm]) {
      ctx.beginPath()
      ctx.arc(S / 2 + Math.cos(a) * S * 0.375, S / 2 + Math.sin(a) * S * 0.375, 3.2 * k, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  return { height: hc, gold: gc }
}
