import { SelectField } from '@components/Elements';
import { tesseractLanguages } from '@utils/tesseractLanguage';
import clsx from 'clsx';
import AddCamera from '@icons/AddCamera.svg';
const Ocr = () => {
  return (
    <div className="p-2 w-fit h-full" style={{ width: '650px' }}>
      <div className="flex justify-between items-center mb-1">
        <div className="flex">
          <div
            className={clsx(
              ' p-1 text-center rounded-sm flex items-center justify-center overflow-x-auto mr-1',
              'bg-gray-light text-blue-prussian hover:cursor-pointer',
            )}
          >
            <span className="mr-1">Upload Image</span> <AddCamera />
          </div>
          <SelectField options={tesseractLanguages} />
        </div>
        <p className="font-bold text-blue-prussian text-md hover:cursor-pointer">Convert</p>
      </div>
      <div className="border-b-2 border-gray-light mb-5 mx-10" />
      <div className="border-dash-space flex items-center h-[80%] mt-10">
        <h1 className="text-gray-true text-center text-[50px] p-10">Upload an image or drag and drop it here</h1>
      </div>
    </div>
  );
};

export default Ocr;
