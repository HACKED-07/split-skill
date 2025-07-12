import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link";

interface UserProfileCardProps {
  name: string
  skillsOffered: { id: string, name: string }[]
  skillsWanted: { id: string, name: string }[]
  rating: string
  avatarSrc?: string
  onRequestClick?: () => void
  id?: string
}

export function UserProfileCard({ name, skillsOffered, skillsWanted, rating, avatarSrc, onRequestClick, id }: UserProfileCardProps) {
  return (
    <Link href={id ? `/profile/${id}` : "#"} className="block group">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between rounded-xl border border-[#E5E7EB] p-6 bg-white text-[#222] shadow-sm gap-4 sm:gap-6 group-hover:border-[#2563eb] transition-all cursor-pointer">
        <div className="flex items-center gap-4 sm:gap-6">
          <Avatar className="h-16 w-16 sm:h-20 sm:w-20 border-4 border-[#F1F3F7] bg-white flex-shrink-0">
            <AvatarImage src={avatarSrc || "/default-avatar.svg"} alt={`${name}'s profile photo`} />
            <AvatarFallback>
              {name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div className="grid gap-2 min-w-0 flex-1">
            <h3 className="text-xl sm:text-2xl font-bold truncate text-[#111]">{name}</h3>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="text-xs sm:text-sm text-[#6B7280] whitespace-nowrap">Skills Offered:</span>
              <div className="flex flex-wrap gap-2">
                {skillsOffered.map((skill) => (
                  <Badge
                    key={skill.id}
                    variant="outline"
                    className="border-[#E5E7EB] text-[#222] bg-[#F1F3F7] px-3 py-1 rounded-xl text-xs"
                  >
                    {skill.name}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="text-xs sm:text-sm text-[#6B7280] whitespace-nowrap">Skills Wanted:</span>
              <div className="flex flex-wrap gap-2">
                {skillsWanted.map((skill) => (
                  <Badge
                    key={skill.id}
                    variant="outline"
                    className="border-[#E5E7EB] text-[#222] bg-[#F1F3F7] px-3 py-1 rounded-xl text-xs"
                  >
                    {skill.name}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center sm:items-end gap-3 sm:gap-4">
          <Button
            variant="outline"
            className="border-[#2563eb] text-[#2563eb] hover:bg-[#2563eb] hover:text-white px-6 py-2 rounded-xl bg-white w-full sm:w-auto font-semibold"
            onClick={e => { e.preventDefault(); onRequestClick && onRequestClick(); }}
          >
            Request
          </Button>
          <div className="text-sm sm:text-lg text-[#6B7280]">
            rating <span className="font-semibold text-[#222]">{rating}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
