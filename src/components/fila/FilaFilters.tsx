import { Card, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";

interface FilaFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  cmeiFilter: string;
  setCmeiFilter: (cmei: string) => void;
  prioridadeFilter: string;
  setPrioridadeFilter: (prioridade: string) => void;
  allCmeiNames: string[];
}

export const FilaFilters = ({ 
  searchTerm, 
  setSearchTerm, 
  cmeiFilter, 
  setCmeiFilter, 
  prioridadeFilter, 
  setPrioridadeFilter, 
  allCmeiNames 
}: FilaFiltersProps) => (
  <Card>
    <CardHeader>
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por nome da criança ou responsável..." 
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Select onValueChange={setCmeiFilter} value={cmeiFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por CMEI" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os CMEIs</SelectItem>
              {allCmeiNames.map(name => (
                  <SelectItem key={name} value={name}>{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select onValueChange={setPrioridadeFilter} value={prioridadeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Prioridade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas</SelectItem>
              <SelectItem value="prioridade">Com Prioridade Social</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </CardHeader>
  </Card>
);