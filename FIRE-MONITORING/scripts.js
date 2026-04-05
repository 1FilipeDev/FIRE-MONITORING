// Inicializar mapa
const map = L.map('map').setView([-16.67, -49.25], 13);

// Camadas de mapa
let lightMap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png');
let darkMap = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png');

// padrão
lightMap.addTo(map);

// Variáveis
let userCoordinates = null;
let selectedMarker = null;

// Evento do formulário
document.getElementById('reportForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const location = document.getElementById('location').value;
    const level = document.getElementById('level').value;
    const category = document.getElementById('category').value;
    const additionalInfo = document.getElementById('additionalInfo').value;
    const photoInput = document.getElementById('photo');
    const photoFile = photoInput.files.length > 0 ? photoInput.files[0] : null;

    if (userCoordinates) {
        addMarker(userCoordinates, level, category, additionalInfo, photoFile);
    } else {
        geocodeLocation(location, function(coordinates) {
            addMarker(coordinates, level, category, additionalInfo, photoFile);
        });
    }

    document.getElementById('reportForm').reset();
});

// Função de cor
function getColor(level) {
    if (level === '3') return 'red';
    if (level === '2') return 'orange';
    return 'yellow';
}

// Adicionar marcador
function addMarker(coordinates, level, category, additionalInfo, photo) {

    let intensity = level === '3' ? 0.9 : level === '2' ? 0.6 : 0.3;
    let color = getColor(level);

    let popupContent = `
        <b>Nível:</b> ${level}<br>
        <b>Local:</b> ${category}<br>
        <b>Info:</b> ${additionalInfo || 'Nenhuma'}<br>
    `;

    if (photo) {
        const imageUrl = URL.createObjectURL(photo);
        popupContent += `<img src="${imageUrl}" style="max-width:100px;"><br>`;
    }

    // Glow externo
    L.circle([coordinates.lat, coordinates.lng], {
        radius: 300,
        color: color,
        fillColor: color,
        fillOpacity: intensity * 0.3,
        weight: 0
    }).addTo(map);

    // Centro
    L.circleMarker([coordinates.lat, coordinates.lng], {
        radius: 8,
        color: color,
        fillColor: color,
        fillOpacity: intensity
    })
    .addTo(map)
    .bindPopup(popupContent);

    map.setView([coordinates.lat, coordinates.lng], 12);
}

// Geocode (CEP + endereço)
function geocodeLocation(location, callback) {

    if (/^\d{5}-?\d{3}$/.test(location)) {

        fetch(`https://viacep.com.br/ws/${location.replace('-', '')}/json/`)
            .then(res => res.json())
            .then(data => {

                if (data.erro) {
                    alert('CEP inválido');
                    return;
                }

                const endereco = `${data.logradouro}, ${data.localidade}, ${data.uf}`;

                fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(endereco)}`)
                    .then(res => res.json())
                    .then(result => {
                        if (result.length > 0) {
                            callback({
                                lat: parseFloat(result[0].lat),
                                lng: parseFloat(result[0].lon)
                            });
                        } else {
                            alert('Local não encontrado');
                        }
                    });
            });

    } else {
        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}`)
            .then(res => res.json())
            .then(data => {
                if (data.length > 0) {
                    callback({
                        lat: parseFloat(data[0].lat),
                        lng: parseFloat(data[0].lon)
                    });
                } else {
                    alert('Local não encontrado');
                }
            });
    }
}

// Geolocalização
document.getElementById('useLocation').addEventListener('click', function() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;

            userCoordinates = { lat, lng: lon };

            document.getElementById('location').value = `Lat: ${lat}, Lon: ${lon}`;
            map.setView([lat, lon], 12);
        });
    } else {
        alert('Geolocalização não suportada');
    }
});

// Clique no mapa
map.on('click', function(e) {
    const lat = e.latlng.lat;
    const lng = e.latlng.lng;

    userCoordinates = { lat, lng };

    document.getElementById('location').value = `Lat: ${lat}, Lon: ${lng}`;

    if (selectedMarker) {
        map.removeLayer(selectedMarker);
    }

    selectedMarker = L.marker([lat, lng])
        .addTo(map)
        .bindPopup("Local selecionado")
        .openPopup();
});

// Legenda
const legend = L.control({ position: 'bottomright' });

legend.onAdd = function () {
    const div = L.DomUtil.create('div', 'info legend');

    div.innerHTML = `
        <div style="background:#1e1e1e;padding:10px;border-radius:8px;color:white;">
            <strong>Nível de Queimada</strong><br><br>
            <span style="color:red;">●</span> Alto<br>
            <span style="color:orange;">●</span> Médio<br>
            <span style="color:yellow;">●</span> Baixo
        </div>
    `;

    return div;
};

legend.addTo(map);

// TOGGLE DE TEMA
const toggleButton = document.getElementById('themeToggle');

// Carregar tema salvo
if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark-mode');
    toggleButton.textContent = '☀️';

    map.removeLayer(lightMap);
    darkMap.addTo(map);
}

// Evento do botão
toggleButton.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');

    if (document.body.classList.contains('dark-mode')) {
        localStorage.setItem('theme', 'dark');
        toggleButton.textContent = '☀️';

        map.removeLayer(lightMap);
        darkMap.addTo(map);

    } else {
        localStorage.setItem('theme', 'light');
        toggleButton.textContent = '🌙';

        map.removeLayer(darkMap);
        lightMap.addTo(map);
    }
});
const menuButton = document.getElementById('menuToggle');
const sideMenu = document.getElementById('sideMenu');

menuButton.addEventListener('click', () => {
    sideMenu.classList.toggle('open');
});

// Fecha ao clicar fora
document.addEventListener('click', (e) => {
    if (!sideMenu.contains(e.target) && !menuButton.contains(e.target)) {
        sideMenu.classList.remove('open');
    }
});