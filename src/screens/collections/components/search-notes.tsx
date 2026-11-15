import type { ChangeEvent } from "react";
import { Input } from "@components";
import Search from "@icons/search.svg";

type SearchNotesProps = { onSearchHandler: (e: ChangeEvent<HTMLInputElement>) => void; value?: string };

export const SearchNotes = ({ onSearchHandler, value }: SearchNotesProps) => {
  return (
    <div className="relative">
      <Input name="name" onChange={onSearchHandler} placeholder="Search" className="w-44! text-left!" value={value} />
      <div className="absolute top-1 right-2 hover:cursor-pointer">
        <Search />
      </div>
    </div>
  );
};
