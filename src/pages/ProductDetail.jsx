import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useCart } from '../contexts/CartContext';
import PageHeader from '../components/UI/PageHeader';
import Skeleton from '../components/UI/Skeleton';
import Spinner from '../components/UI/Spinner';
import { ShoppingCart, Star } from 'lucide-react';

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select(`*, vendors ( business_name )`)
        .eq('id', id)
        .single();
      
      if (error) {
        console.error('Error fetching product:', error);
      } else {
        setProduct(data);
      }
      setLoading(false);
    };

    if (id) {
      fetchProduct();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-96">
          <Spinner />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-bold">Product not found</h2>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-lg shadow-xl p-8"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>
            <motion.img
              src={product.image_url || 'https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://placehold.co/600x400.png?text=Product'}
              alt={product.name}
              className="w-full h-auto rounded-lg shadow-md object-cover"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">{product.name}</h1>
            <p className="text-lg text-gray-600 mb-6">{product.description}</p>
            <div className="flex items-center mb-6">
              <div className="flex text-yellow-400">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 fill-current" />)}
              </div>
              <span className="ml-2 text-gray-600">(12 Reviews)</span>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Sold by: <span className="font-medium text-gray-700">{product.vendors.business_name}</span>
            </p>
            <div className="mb-6">
              <span className="text-4xl font-bold text-blue-600">${product.price.toFixed(2)}</span>
            </div>
            <button
              onClick={() => addToCart(product.id)}
              className="w-full flex items-center justify-center bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-200"
            >
              <ShoppingCart className="mr-2 w-5 h-5" />
              Add to Cart
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ProductDetail;
