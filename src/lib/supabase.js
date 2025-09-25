import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Auth helpers
export const auth = {
  signUp: async (email, password, userData = {}) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData,
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    })
    return { data, error }
  },

  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { data, error }
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  getCurrentUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser()
    return { user, error }
  },

  onAuthStateChange: (callback) => {
    return supabase.auth.onAuthStateChange(callback)
  }
}

// Database helpers
export const db = {
  // Profiles
  getProfile: async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    return { data, error }
  },

  updateProfile: async (userId, updates) => {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
    return { data, error }
  },

  // Products
  getProducts: async () => {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        vendors (
          business_name,
          business_description
        )
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
    return { data, error }
  },

  getProductsByVendor: async (vendorId) => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('vendor_id', vendorId)
      .order('created_at', { ascending: false })
    return { data, error }
  },

  createProduct: async (product) => {
    const { data, error } = await supabase
      .from('products')
      .insert(product)
      .select()
    return { data, error }
  },

  updateProduct: async (id, updates) => {
    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
    return { data, error }
  },

  deleteProduct: async (id) => {
    const { data, error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)
    return { data, error }
  },

  // Cart
  getCartItems: async (userId) => {
    const { data, error } = await supabase
      .from('cart_items')
      .select(`
        *,
        products (
          id,
          name,
          price,
          image_url,
          vendors (
            business_name
          )
        )
      `)
      .eq('user_id', userId)
    return { data, error }
  },

  addToCart: async (userId, productId, quantity = 1) => {
    const { data, error } = await supabase
      .from('cart_items')
      .upsert(
        { user_id: userId, product_id: productId, quantity },
        { onConflict: 'user_id,product_id' }
      )
      .select()
    return { data, error }
  },

  updateCartItem: async (id, quantity) => {
    const { data, error } = await supabase
      .from('cart_items')
      .update({ quantity })
      .eq('id', id)
      .select()
    return { data, error }
  },

  removeFromCart: async (id) => {
    const { data, error } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', id)
    return { data, error }
  },

  clearCart: async (userId) => {
    const { data, error } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', userId)
    return { data, error }
  },

  // Orders
  createOrderFromCart: async (shippingDetails) => {
    const { data, error } = await supabase.rpc('create_order_from_cart', {
      shipping_details: shippingDetails
    })
    return { data, error }
  },

  getOrders: async (userId) => {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          products (
            name,
            image_url
          )
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    return { data, error }
  },

  updateOrderStatus: async (orderId, status) => {
    const { data, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId)
      .select();
    return { data, error };
  },

  // Vendors
  getVendor: async (userId) => {
    const { data, error } = await supabase
      .from('vendors')
      .select('*')
      .eq('user_id', userId)
      .single()
    return { data, error }
  },

  getVendorOrders: async (vendorId) => {
    const { data, error } = await supabase.rpc('get_vendor_orders', {
      p_vendor_id: vendorId
    });
    const orders = data ? data.map(d => d.order_details) : [];
    return { data: orders, error };
  },

  createVendor: async (vendor) => {
    const { data, error } = await supabase
      .from('vendors')
      .insert(vendor)
      .select()
    return { data, error }
  },

  updateVendor: async (id, updates) => {
    const { data, error } = await supabase
      .from('vendors')
      .update(updates)
      .eq('id', id)
      .select()
    return { data, error }
  },

  vendorGetDashboardStats: async (vendorId) => {
    const { data, error } = await supabase.rpc('get_vendor_dashboard_stats', {
      p_vendor_id: vendorId
    });
    return { data, error };
  },

  // Admin
  adminGetDashboardStats: async () => {
    const { data, error } = await supabase.rpc('get_admin_dashboard_stats');
    return { data, error };
  },

  adminGetAllUsers: async () => {
    const { data, error } = await supabase.rpc('admin_get_all_users');
    return { data, error };
  },

  adminUpdateUserRole: async (userId, role) => {
    const { data, error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', userId)
      .select();
    return { data, error };
  },

  adminGetAllVendors: async () => {
    const { data, error } = await supabase.rpc('admin_get_all_vendors');
    return { data, error };
  },

  adminUpdateVendorApproval: async (vendorId, isApproved) => {
    const { data, error } = await supabase.rpc('admin_update_vendor_approval', {
      p_vendor_id: vendorId,
      p_is_approved: isApproved
    });
    return { data, error };
  },

  adminGetAllProducts: async () => {
    const { data, error } = await supabase.rpc('admin_get_all_products');
    return { data, error };
  },

  adminUpdateProductStatus: async (productId, isActive) => {
    const { data, error } = await supabase.rpc('admin_update_product_status', {
      p_product_id: productId,
      p_is_active: isActive
    });
    return { data, error };
  },

  adminGetAllOrders: async () => {
    const { data, error } = await supabase.rpc('admin_get_all_orders');
    return { data, error };
  },
  
  adminGetReportsData: async () => {
    const { data, error } = await supabase.rpc('get_admin_reports_data');
    return { data, error };
  },
}
