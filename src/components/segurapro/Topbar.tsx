import { Search, Bell, ChevronDown } from 'lucide-react'

interface TopbarProps {
  searchQuery: string
  onSearchChange: (value: string) => void
  unreadNotifications?: number
  userName?: string
  userRole?: string
  userInitials?: string
}

export function Topbar({
  searchQuery,
  onSearchChange,
  unreadNotifications = 5,
  userName = 'João Silva',
  userRole = 'Administrador',
  userInitials = 'JS',
}: TopbarProps) {
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-10 select-none">
      {/* Search Input */}
      <div className="flex-1 max-w-xl">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar colaboradores, EPIs, treinamentos, documentos..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Right User Actions */}
      <div className="flex items-center gap-5 ml-4">
        {/* Notification Bell */}
        <button
          type="button"
          aria-label="Notificações"
          className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
        >
          <Bell className="w-5 h-5" />
          {unreadNotifications > 0 && (
            <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
              {unreadNotifications}
            </span>
          )}
        </button>

        {/* User Profile */}
        <div className="flex items-center gap-3 pl-2 border-l border-slate-200 cursor-pointer group">
          <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-semibold text-xs flex items-center justify-center shadow-sm">
            {userInitials}
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-sm font-bold text-slate-900 leading-tight group-hover:text-blue-600 transition-colors">
              {userName}
            </p>
            <p className="text-xs text-slate-500 leading-tight">{userRole}</p>
          </div>
          <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
        </div>
      </div>
    </header>
  )
}
