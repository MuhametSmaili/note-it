import { ChangeEvent } from 'react';
import { Input } from '@components/Elements';
// icons
import Search from '@icons/Search.svg';

type SearchNotesProps = { onSearchHandler: (e: ChangeEvent<HTMLInputElement>) => void; value?: string };

export const SearchNotes = ({ onSearchHandler, value }: SearchNotesProps) => {
  return (
    <div className="relative">
      <Input name="name" onChange={onSearchHandler} placeholder="Search" className="!text-left !w-44" value={value} />
      <div className="absolute right-2 top-2 hover:cursor-pointer">
        <Search />
      </div>
    </div>
  );
};
