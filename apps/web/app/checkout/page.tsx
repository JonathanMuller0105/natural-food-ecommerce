'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '../context/CartContext';
import Link from 'next/link';

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, cartTotal, clearCart } = useCart(); 

  const [formData, setFormData] = useState({
    customerName: '', zipCode: '', phone: '', address: '', number: '', neighborhood: '', email: ''
  });

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (cart.length === 0) {
      router.push('/');
      return;
    }

    const savedCustomer = localStorage.getItem('naturalFoodCustomer');
    if (savedCustomer) {
      const customer = JSON.parse(savedCustomer);
      setFormData({
        customerName: customer.name || customer.customerName || '',
        zipCode: customer.zipCode || '',
        phone: customer.phone || '',
        address: customer.address || '',
        number: customer.number || '',
        neighborhood: customer.neighborhood || '',
        email: customer.email || '' 
      });
      setIsLoggedIn(true);
    }
  }, [cart, router]);

  const handleCepBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const cep = e.target.value.replace(/\D/g, '');
    if (cep.length === 8) {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await res.json();
        if (!data.erro) {
          setFormData({ ...formData, zipCode: cep, address: data.logradouro, neighborhood: data.bairro });
        }
      } catch (err) { console.error('Erro no CEP', err); }
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const existingData = localStorage.getItem('naturalFoodCustomer');
    let customerDataToLogin = null;

    if (existingData) {
      const parsedData = JSON.parse(existingData);
      if (parsedData.email === loginEmail) {
        customerDataToLogin = parsedData;
      }
    }

    if (!customerDataToLogin) {
      const rawName = loginEmail.split('@')[0].replace(/[^a-zA-Z]/g, ' ');
      const formattedName = rawName.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');

      customerDataToLogin = {
        name: formattedName || 'Visitante',
        email: loginEmail,
        zipCode: '01310100',
        phone: '(11) 99999-9999',
        address: 'Avenida Paulista',
        number: '1000',
        neighborhood: 'Bela Vista'
      };
    }

    setFormData({
      customerName: customerDataToLogin.name || customerDataToLogin.customerName || '',
      zipCode: customerDataToLogin.zipCode || '',
      phone: customerDataToLogin.phone || '',
      address: customerDataToLogin.address || '',
      number: customerDataToLogin.number || '',
      neighborhood: customerDataToLogin.neighborhood || '',
      email: customerDataToLogin.email || ''
    });
    
    setIsLoggedIn(true);
    setIsLoginModalOpen(false);
    localStorage.setItem('naturalFoodCustomer', JSON.stringify(customerDataToLogin));
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    let orderSuccessful = false; // TRAVA DE SEGURANÇA CONTRA O BUG DO NEXT.JS

    const orderPayload = {
      ...formData,
      customerEmail: formData.email,
      total: cartTotal,
      items: cart.map(item => ({
        productId: item.product.id,
        quantity: Number(item.quantity ?? 1),
        price: Number(item.price ?? item.product?.price ?? 0) 
      }))
    };

    try {
      const res = await fetch('http://localhost:3333/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });

      if (res.ok) {
        orderSuccessful = true;
      } else {
        alert('Erro ao processar o pedido. Tente novamente.');
      }
    } catch (error) {
      alert('Erro de conexão com o servidor.');
    } finally {
      setIsLoading(false);
    }

    // Se o pedido salvou com sucesso, redirecionamos FORA do try/catch
    if (orderSuccessful) {
      clearCart(); 
      const wantsAnother = window.confirm('🎉 Pedido realizado com sucesso!\nSua sacola foi esvaziada.\n\nDeseja realizar outro pedido?');
      router.push('/'); 
    }
  };

  if (cart.length === 0) return null; 

  return (
    <main className="min-h-screen bg-[#F8F9FA] p-6 md:p-12 font-sans text-gray-800">
      <div className="max-w-6xl mx-auto">
        <Link href="/" className="text-[#2D5A27] font-bold hover:underline mb-8 inline-block flex items-center gap-2">← Voltar para a Loja</Link>
        <h1 className="text-3xl md:text-4xl font-extrabold text-[#1A3616] mb-8">Finalizar Pedido</h1>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          
          <div className="lg:col-span-3 bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-end border-b pb-4 mb-6">
              <h2 className="text-xl font-bold text-[#1A3616]">Informações de Entrega</h2>
              {!isLoggedIn && (
                <button type="button" onClick={() => setIsLoginModalOpen(true)} className="text-sm text-[#E67E22] font-bold hover:underline">Já tem conta? Faça Login</button>
              )}
            </div>

            {isLoggedIn ? (
              <div className="bg-green-50 p-6 rounded-2xl border border-green-200">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-[#2D5A27] flex items-center gap-2">✅ Dados Confirmados</h3>
                    <p className="text-sm text-gray-600 mt-1">Revise os dados abaixo para a entrega.</p>
                  </div>
                  <button type="button" onClick={() => setIsLoggedIn(false)} className="text-sm text-gray-500 hover:text-[#2D5A27] font-bold underline">Editar Dados</button>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm space-y-2 text-sm text-gray-700">
                  <p><strong>Comprador:</strong> {formData.customerName}</p>
                  <p><strong>E-mail (Rastreio):</strong> {formData.email}</p>
                  <p><strong>Telefone:</strong> {formData.phone}</p>
                  <p><strong>Endereço:</strong> {formData.address}, {formData.number}</p>
                  <p><strong>Bairro:</strong> {formData.neighborhood} - <strong>CEP:</strong> {formData.zipCode}</p>
                </div>
              </div>
            ) : (
              <form id="checkout-form" onSubmit={handleCheckout} className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Nome Completo</label>
                  <input required type="text" placeholder="Ex: João Silva" className="w-full p-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-[#8BC34A]" value={formData.customerName} onChange={e => setFormData({...formData, customerName: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Seu E-mail (Para rastrear o pedido)</label>
                  <input required type="email" placeholder="email@exemplo.com" className="w-full p-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-[#8BC34A]" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">CEP</label>
                    <input required type="text" placeholder="00000-000" className="w-full p-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-[#8BC34A]" value={formData.zipCode} onChange={e => setFormData({...formData, zipCode: e.target.value})} onBlur={handleCepBlur} />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Telefone</label>
                    <input required type="text" placeholder="(00) 00000-0000" className="w-full p-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-[#8BC34A]" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Endereço (Rua/Avenida)</label>
                  <input required type="text" className="w-full p-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-[#8BC34A]" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Número</label>
                    <input required type="text" className="w-full p-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-[#8BC34A]" value={formData.number} onChange={e => setFormData({...formData, number: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Bairro</label>
                    <input required type="text" className="w-full p-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-[#8BC34A]" value={formData.neighborhood} onChange={e => setFormData({...formData, neighborhood: e.target.value})} />
                  </div>
                </div>
              </form>
            )}
          </div>

          <div className="lg:col-span-2">
            <div className="bg-[#2D5A27] text-white p-8 rounded-3xl shadow-xl sticky top-8">
              <h2 className="text-xl font-bold border-b border-white/20 pb-4 mb-6">Resumo da Compra</h2>
              <div className="space-y-4 mb-8 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                {cart.map(item => {
                  const itemPrice = Number(item.price ?? item.product?.price ?? 0);
                  const itemQty = Number(item.quantity ?? 1);
                  const lineTotal = itemPrice * itemQty;
                  return (
                    <div key={item.product.id} className="flex justify-between text-sm font-medium">
                      <span className="text-green-100">{itemQty}x {item.product.name}</span>
                      <span className="font-bold">R$ {lineTotal.toFixed(2).replace('.', ',')}</span>
                    </div>
                  );
                })}
              </div>
              <div className="border-t border-white/20 pt-6 mb-8 flex justify-between items-end">
                <span className="text-xl font-bold">Total:</span><span className="text-3xl font-extrabold">R$ {cartTotal.toFixed(2).replace('.', ',')}</span>
              </div>
              <button 
                onClick={isLoggedIn ? handleCheckout : undefined} 
                form={!isLoggedIn ? "checkout-form" : undefined}
                disabled={isLoading}
                className="w-full bg-[#E67E22] hover:bg-[#D35400] text-white font-bold py-4 rounded-xl shadow-lg transition-colors text-lg flex justify-center items-center"
              >
                {isLoading ? 'Processando...' : 'Confirmar Pedido'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {isLoginModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl relative animate-slide-in">
            <button onClick={() => setIsLoginModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-black font-bold text-xl">X</button>
            <h2 className="text-2xl font-bold text-[#2D5A27] mb-2 text-center">Faça Login</h2>
            <form onSubmit={handleLogin} className="space-y-4 mt-6">
              <input required type="email" placeholder="Seu E-mail" className="w-full p-4 border rounded-xl bg-gray-50 outline-none focus:ring-2 focus:ring-[#8BC34A]" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} />
              <input required type="password" placeholder="Sua Senha" className="w-full p-4 border rounded-xl bg-gray-50 outline-none focus:ring-2 focus:ring-[#8BC34A]" />
              <button type="submit" className="w-full bg-[#E67E22] text-white font-bold py-4 rounded-xl shadow-lg hover:bg-[#D35400] transition-colors">Entrar e Continuar</button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}