import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const response = await api.get(`/products/${productId}`);
      const product = response.data;

      const stockResponse = await api.get(`/stock/${productId}`);
      const stock = stockResponse.data;

      const productExists = cart.find(p => p.id === productId);

      if (productExists) {
        if (productExists.amount < stock.amount) {
          const updatedCart = cart.map(p => {
            if (p.id === productId) {
              p.amount += 1;
            }
  
            return p;
          });

        setCart(updatedCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
        } else {
          toast.error('Quantidade solicitada fora de estoque');
        }
      } else {
        setCart([...cart, { ...product, amount: 1 }]);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify([...cart, { ...product, amount: 1 }]));
      }
      
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {

      const productExists = cart.find(p => p.id === productId);

      if (productExists) {
        const updatedCart = cart.filter(p => p.id !== productId);
        setCart(updatedCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
      } else {
        toast.error('Erro na remoção do produto');
      }

    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {

      const productExists = cart.find(p => p.id === productId);

      const stockResponse = await api.get(`/stock/${productId}`);
      const stock = stockResponse.data;

      if (productExists) {
        if (amount > 0 && amount <= stock.amount) {
          const updatedCart = cart.map(p => {
            if (p.id === productId) {
              p.amount = amount;
            }

            return p;
          }
          );
          setCart(updatedCart);
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
        } else {
          toast.error('Quantidade solicitada fora de estoque');
        }
      } else {
        toast.error('Quantidade solicitada fora de estoque');
      }

    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
