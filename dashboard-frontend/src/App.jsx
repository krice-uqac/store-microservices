// src/App.jsx
import { useState, useEffect } from 'react';
import { authApi, inventoryApi } from './api/client';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [userRole, setUserRole] = useState(localStorage.getItem('role') || '');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [registerRole, setRegisterRole] = useState('read_only');
  const [isRegistering, setIsRegistering] = useState(false);
  const [stocks, setStocks] = useState([]);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Formulaire de restock
  const [prodIdInput, setProdIdInput] = useState('');
  const [quantityInput, setQuantityInput] = useState('');

  // Charger les stocks si connecté
  const fetchStocks = async () => {
    try {
      const res = await inventoryApi.get('/inventory/');
      setStocks(res.data);
    } catch (err) {
      console.error("Erreur lors de la récupération des stocks", err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchStocks();
    }
  }, [token]);

  // Connexion
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    try {
      // Envoi des identifiants en JSON au auth-service
      const res = await authApi.post('/auth/login', {
        email: username,
        password: password,
      });
      const accessToken = res.data.access_token;

      const payload = JSON.parse(atob(accessToken.split('.')[1]));

      localStorage.setItem('token', accessToken);
      localStorage.setItem('role', payload.role || 'USER');

      setToken(accessToken);
      setUserRole(payload.role || 'USER');
    } catch (err) {
      setError('Identifiants invalides ou serveur indisponible');
    }
  };

  // Inscription
  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    try {
      await authApi.post('/auth/register', {
        email: username,
        password: password,
        role: registerRole
      });
      setSuccessMsg('Compte créé avec succès ! Connectez-vous.');
      setIsRegistering(false);
    } catch (err) {
      if (err.response && err.response.data && err.response.data.detail) {
        setError(err.response.data.detail);
      } else {
        setError("Erreur lors de l'inscription");
      }
    }
  };

  // Déconnexion
  const handleLogout = () => {
    localStorage.clear();
    setToken('');
    setUserRole('');
    setStocks([]);
  };

  // Soumission d'un réapprovisionnement (ADMIN uniquement)
  const handleRestock = async (e) => {
    e.preventDefault();
    try {
      await inventoryApi.post('/inventory/restock', {
        product_id: prodIdInput,
        quantity: parseInt(quantityInput, 10)
      });
      setProdIdInput('');
      setQuantityInput('');
      fetchStocks(); // Recharger le tableau
    } catch (err) {
      alert("Erreur lors du restock. Vérifiez vos privilèges Admin.");
    }
  };

  // ÉCRAN DE LOGIN / REGISTER
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <form onSubmit={isRegistering ? handleRegister : handleLogin} className="bg-white p-8 rounded-lg shadow-md w-96">
          <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
            {isRegistering ? "Inscription" : "Connexion"}
          </h2>
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          {successMsg && <p className="text-green-600 text-sm mb-4">{successMsg}</p>}
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input type="email" value={username} onChange={e => setUsername(e.target.value)} required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 bg-gray-50 border" />
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700">Mot de passe</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 bg-gray-50 border" />
          </div>

          {isRegistering && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700">Rôle (pour la démo)</label>
              <select value={registerRole} onChange={e => setRegisterRole(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 bg-gray-50 border">
                <option value="admin">Admin</option>
                <option value="read_write">Lecture / Écriture</option>
                <option value="read_only">Lecture Seule</option>
              </select>
            </div>
          )}

          <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded-md font-semibold hover:bg-blue-700">
            {isRegistering ? "S'inscrire" : "Se connecter"}
          </button>

          <p className="mt-4 text-sm text-center text-gray-600">
            {isRegistering ? "Déjà un compte ?" : "Pas encore de compte ?"}
            <button type="button" onClick={() => { setIsRegistering(!isRegistering); setError(''); setSuccessMsg(''); }} className="ml-1 text-blue-600 hover:underline">
              {isRegistering ? "Connectez-vous" : "Créez-en un"}
            </button>
          </p>
        </form>
      </div>
    );
  }

  // TABLEAU DE BORD PRINCIPAL
  const isAdmin = userRole.toUpperCase() === 'ADMIN';

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-8 bg-white p-4 rounded-lg shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Dashboard Logistique</h1>
            <p className="text-sm text-gray-500">Connecté en tant que : <span className="font-semibold text-blue-600">{userRole}</span></p>
          </div>
          <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600">
            Déconnexion
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Section Tableau des Stocks */}
          <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-bold mb-4 text-gray-700">État des Niveaux de Stock</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product ID</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Quantité Totale</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Réservations</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Disponible</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {stocks.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-4 py-4 text-center text-sm text-gray-500">Aucun produit en stock.</td>
                    </tr>
                  ) : (
                    stocks.map((stock) => (
                      <tr key={stock.id}>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-mono text-gray-600">{stock.product_id}</td>
                        <td className="px-4 py-4 text-center text-sm text-gray-800 font-semibold">{stock.quantity}</td>
                        <td className="px-4 py-4 text-center text-sm text-orange-600">{stock.reserved_quantity}</td>
                        <td className="px-4 py-4 text-center text-sm text-green-600 font-bold">
                          {stock.quantity - stock.reserved_quantity}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section Action Restock (Visible/Utile uniquement pour l'ADMIN) */}
          <div className="bg-white p-6 rounded-lg shadow-sm h-fit">
            <h3 className="text-lg font-bold mb-4 text-gray-700">Réapprovisionnement (Restock)</h3>
            {isAdmin ? (
              <form onSubmit={handleRestock}>
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-500 uppercase">Product UUID</label>
                  <input type="text" placeholder="ex: 572960b8-95ed-4da3-bf3f..." value={prodIdInput} onChange={e => setProdIdInput(e.target.value)} required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 text-sm bg-gray-50 border font-mono" />
                </div>
                <div className="mb-6">
                  <label className="block text-xs font-medium text-gray-500 uppercase">Quantité à ajouter</label>
                  <input type="number" placeholder="100" value={quantityInput} onChange={e => setQuantityInput(e.target.value)} required min="1"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 text-sm bg-gray-50 border" />
                </div>
                <button type="submit" className="w-full bg-green-600 text-white p-2 rounded-md font-semibold hover:bg-green-700">
                  Valider l'apport
                </button>
              </form>
            ) : (
              <div className="p-4 bg-yellow-50 text-yellow-700 text-sm rounded-md border border-yellow-200">
                ⚠️ Action restreinte. Vous devez posséder le rôle <strong>ADMIN</strong> pour injecter du stock.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
