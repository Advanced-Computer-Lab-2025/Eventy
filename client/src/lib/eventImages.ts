export function getEventImage(type?: string, name?: string): string {
  const t = (type || "").toLowerCase();
  const n = (name || "").toLowerCase();
  if (t.includes("sports") || n.includes("match") || n.includes("tournament"))
    return "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=1200&auto=format&fit=crop"; // stadium
  if (t.includes("music") || n.includes("concert") || n.includes("band"))
    return "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=1200&auto=format&fit=crop"; // concert
  if (t.includes("arts") || n.includes("exhibition") || n.includes("gallery"))
    return "https://images.unsplash.com/photo-1504198266285-165a9bdcf0f8?w=1200&auto=format&fit=crop"; // art gallery
  if (t.includes("career") || n.includes("job") || n.includes("fair"))
    return "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1200&auto=format&fit=crop"; // career fair
  if (
    t.includes("workshop") ||
    n.includes("workshop") ||
    n.includes("training")
  )
    return "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&auto=format&fit=crop"; // workshop
  if (
    t.includes("conference") ||
    n.includes("conference") ||
    n.includes("summit")
  )
    return "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=1200&auto=format&fit=crop"; // conference
  if (t.includes("trip") || n.includes("trip") || n.includes("tour"))
    return "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&auto=format&fit=crop&q=80"; // travel alt
  if (t.includes("bazaar") || n.includes("bazaar") || n.includes("market"))
    return "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1200&auto=format&fit=crop"; // market
  if (
    t.includes("platform_booth") ||
    t.includes("booth") ||
    n.includes("booth") ||
    n.includes("platform")
  )
    return "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&auto=format&fit=crop"; // platform booth/store
  if (t.includes("academic") || n.includes("lecture") || n.includes("seminar"))
    return "https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?w=1200&auto=format&fit=crop"; // lecture hall
  return "https://images.unsplash.com/photo-1520975922071-a5705a1b69c8?w=1200&auto=format&fit=crop"; // campus generic
}
