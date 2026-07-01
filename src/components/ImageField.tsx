import Image from "next/image";

export function ImageField({ currentImage }: { currentImage?: string | null }) {
  return (
    <div className="field">
      <label htmlFor="coverImage">대표 이미지</label>
      {currentImage && (
        <div className="media">
          <Image src={currentImage} alt="" width={800} height={600} />
        </div>
      )}
      <input
        className="input"
        id="coverImage"
        name="coverImage"
        type="file"
        accept="image/*"
      />
    </div>
  );
}
