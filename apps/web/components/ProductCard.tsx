'use client';

interface ProductCardProps {
  id: string;
  name: string;
  price: string;
  promotionalPrice?: string | null;
  tags: string[];
  image: string;
  onAddToCart: (quantity: number) => void;
}

export default function ProductCard({ id, name, price, promotionalPrice, tags, image, onAddToCart }: ProductCardProps) {
  // Lógica: Se tem preço promocional e é maior que zero, a promoção é válida.
  const isPromoValid = promotionalPrice && Number(promotionalPrice) > 0;
  const currentPrice = isPromoValid ? promotionalPrice : price;

  return (
    <div className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-shadow overflow-hidden flex flex-col h-full relative group border border-gray-50">
      {/* Etiqueta de Promoção */}
      {isPromoValid && (
        <div className="absolute top-4 left-4 bg-red-500 text-white text-xs font-black px-3 py-1 rounded-full z-10 shadow-md animate-bounce">
          🔥 OFERTA
        </div>
      )}

      <div className="h-48 w-full overflow-hidden bg-gray-50 relative">
        <img src={image || 'https://via.placeholder.com/300?text=Produto'} alt={name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
      </div>
      
      <div className="p-5 flex flex-col flex-grow">
        <div className="flex flex-wrap gap-1 mb-3">
          {tags.map((tag, index) => (
            <span key={index} className="bg-[#E8F5E9] text-[#2D5A27] text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider">
              {tag}
            </span>
          ))}
        </div>
        <h3 className="font-bold text-gray-800 text-lg mb-2">{name}</h3>
        
        {/* CORREÇÃO DO LAYOUT: Preço em cima, Botão Largo Laranja em baixo */}
        <div className="mt-auto pt-4 flex flex-col gap-4">
          <div>
            {/* Se estiver em promoção, risca o valor antigo e destaca o novo */}
            {isPromoValid && <p className="text-xs text-gray-400 line-through">R$ {Number(price).toFixed(2).replace('.', ',')}</p>}
            <p className={`font-extrabold text-2xl ${isPromoValid ? 'text-red-500' : 'text-[#2D5A27]'}`}>
              R$ {Number(currentPrice).toFixed(2).replace('.', ',')}
            </p>
          </div>
          
          {/* NOVO BOTÃO DE CTA (Call to Action) */}
          <button 
            onClick={() => onAddToCart(1)} 
            className="w-full py-3 rounded-xl bg-[#E67E22] hover:bg-[#D35400] text-white font-bold text-sm shadow-md transition-colors transform active:scale-95 flex justify-center items-center gap-2"
          >
            🛒 Adicionar à Sacola
          </button>
        </div>
      </div>
    </div>
  );
}