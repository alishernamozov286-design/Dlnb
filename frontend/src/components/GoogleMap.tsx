interface GoogleMapProps {
  className?: string;
}

export default function GoogleMap({ className = '' }: GoogleMapProps) {
  // UZ Daewoo service G'ijduvon dehqon bozorida joylashgan koordinatalar
  const daewooServiceLocation = "39.7675,64.4286";
  const daewooMapUrl = `https://www.google.com/maps/search/UZ+Daewoo+service+G'ijduvon/@${daewooServiceLocation},15z`;

  const handleMapClick = () => {
    window.open(daewooMapUrl, '_blank');
  };

  return (
    <div className={`relative ${className}`}>
      {/* Google Maps Embed - clickable */}
      <div 
        className="w-full h-full rounded-2xl shadow-2xl border-4 border-white overflow-hidden bg-gray-100 cursor-pointer hover:shadow-3xl transition-shadow"
        onClick={handleMapClick}
      >
        <iframe
          src={`https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3048.5!2d64.4286!3d39.7675!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMznCsDQ2JzAzLjAiTiA2NMKwMjUnNDMuMCJF!5e0!3m2!1sen!2s!4v1642000000000!5m2!1sen!2s&q=UZ+Daewoo+service+G'ijduvon`}
          width="100%"
          height="100%"
          style={{ border: 0, minHeight: '400px', pointerEvents: 'none' }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="rounded-2xl"
        />
      </div>
    </div>
  );
}