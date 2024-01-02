const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = 3001;

const API_BASE_URL = 'https://api.mercadolibre.com';

app.use(cors());

//Extract transform return con Query search MELI
app.get('/api/items/:id', async (req, res) => {
  try {
    const itemId = req.params.id;

    //Extract
    const [itemInfo, itemDescription] = await Promise.all([
      axios.get(`${API_BASE_URL}/items/${itemId}`),
      axios.get(`${API_BASE_URL}/items/${itemId}/description`),
    ]);

    //Transform
    const datosTransformados = {
      author: {
        name: 'Juan',
        lastname: 'Muñoz',
      },
      item: {
        id: itemInfo.data.id,
        title: itemInfo.data.title,
        price: {
          currency: itemInfo.data.currency_id,
          amount: itemInfo.data.price,
          decimals: 2,
        },
        picture: itemInfo.data.thumbnail,
        condition: itemInfo.data.condition,
        free_shipping: itemInfo.data.shipping.free_shipping,
        sold_quantity: itemInfo.data.sold_quantity,
        description: itemDescription.data.plain_text,
      },
    };

    //Return
    res.json(datosTransformados);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al consultar la API externa por ID' });
  }
});

//Extract transform return con Query search MELI
app.get('/api/items', async (req, res) => {
  try {
    const searchParam = req.query.search;

    const respuestaApi = await axios.get(`${API_BASE_URL}/sites/MLA/search?q=${searchParam}`);

    const breadCrumbs = respuestaApi.data.filters.reduce((names, filter) => {
      if (filter.values) {
        filter.values.forEach(value => {
          if (value.path_from_root) {
            value.path_from_root.forEach(path => {
              if (path.name) {
                names.push(path.name);
              }
            });
          }
        });
      }
      return names;
    }, []);

    // Transforma los datos según tus necesidades (aquí es solo un ejemplo)
    const datosTransformados = {
      author: {
        name: 'Nombre',
        lastname: 'Apellido',
      },
      categories: breadCrumbs, // Puedes ajustar las categorías según tus necesidades
      items: respuestaApi.data.results.map(item => ({
        id: item.id,
        title: item.title,
        price: {
          currency: item.currency_id,
          amount: item.price,
          decimals: 2, // Ejemplo, ajusta según tus necesidades
        },
        picture: item.thumbnail,
        condition: item.condition,
        free_shipping: item.shipping.free_shipping,
      })),
    };

    // Devuelve los datos transformados
    res.json(datosTransformados);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al consultar la API externa por búsqueda' });
  }
});

app.listen(PORT, () => {
  console.log(`Server escuchando en http://localhost:${PORT}`);
});
