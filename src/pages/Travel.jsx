import React, { useState } from 'react';
import { MapPin, Calendar, Camera, Navigation, Map as MapIcon, Plus, X, Trash2, Activity, Timer, Trophy, Edit2, Search, Cloud, CloudOff, Globe } from 'lucide-react';
import { useCloudStorage } from '../hooks/useCloudStorage';
import MarkdownEditor from '../components/MarkdownEditor';
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";
const chinaGeoUrl = "https://raw.githubusercontent.com/deldersveld/topojson/master/countries/china/china-provinces.json";

const Travel = () => {
  const initialTrips = [
    {
      id: 1,
      location: "Kyoto, Japan",
      title: "Autumn in Arashiyama",
      date: "Nov 2023",
      imageColor: "bg-orange-100",
      description: "The bamboo grove was quieter than expected in the early morning light.",
      content: "## Arashiyama Bamboo Grove\n\nThe bamboo grove was quieter than expected in the early morning light. The rustling of leaves created a natural symphony that felt almost spiritual.\n\n### Highlights\n- Tenryu-ji Temple\n- Bamboo Alley\n- Togetsukyo Bridge\n\n![Kyoto](https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&q=80&w=1000)\n\nWe woke up at 5 AM to catch the sunrise. It was absolutely worth it.",
      height: "h-64",
      coordinates: [135.7681, 35.0116]
    },
    {
      id: 2,
      location: "Reykjavik, Iceland",
      title: "Chasing the Northern Lights",
      date: "Feb 2024",
      imageColor: "bg-teal-100",
      description: "Standing in the freezing cold, waiting for the sky to dance.",
      content: "# Aurora Borealis\n\nStanding in the freezing cold, waiting for the sky to dance. When it finally happened, time seemed to stop completely.\n\n**Temperature**: -15°C\n**Location**: Grotta Lighthouse\n\nThe lights started as a faint green glow and exploded into purple and pink ribbons.",
      height: "h-96",
      coordinates: [-21.8277, 64.1265]
    },
    {
      id: 3,
      location: "Santorini, Greece",
      title: "Blue Domes and Sunsets",
      date: "Jun 2023",
      imageColor: "bg-blue-100",
      description: "The contrast between the stark white buildings and the deep blue Aegean sea.",
      content: "## Oia Sunset\n\nThe contrast between the stark white buildings and the deep blue Aegean sea is something no photo can truly capture.\n\nWe stayed in a cave hotel overlooking the caldera. The stairs were a workout, but the view was unparalleled.",
      height: "h-72",
      coordinates: [25.4615, 36.3932]
    },
    {
      id: 4,
      location: "Banff, Canada",
      title: "Hiking the Rockies",
      date: "Aug 2023",
      imageColor: "bg-emerald-100",
      description: "Lake Louise reflects the mountains like a perfect mirror.",
      content: "# Canadian Rockies\n\nLake Louise reflects the mountains like a perfect mirror. The air is crisp, clean, and invigorating.\n\n### Trails Hiked\n1. Plain of Six Glaciers\n2. Lake Agnes Teahouse\n3. Big Beehive\n\nSaw a grizzly bear from a safe distance!",
      height: "h-80",
      coordinates: [-115.5708, 51.1784]
    },
    {
      id: 5,
      location: "Marrakech, Morocco",
      title: "Colors of the Medina",
      date: "Oct 2023",
      imageColor: "bg-red-100",
      description: "Getting lost in the souks is part of the experience.",
      content: "## The Red City\n\nGetting lost in the souks is part of the experience. The smell of spices and the vibrant colors of textiles everywhere.\n\nBought some amazing rugs and spices. The Mint Tea is addictive.",
      height: "h-64",
      coordinates: [-7.9891, 31.6295]
    }
  ];

  const initialSports = [
    { id: 1, date: '2023-11-05', type: 'Marathon', name: 'New York City Marathon', distance: '42.195km', time: '3:45:20', pace: '5:20/km', notes: 'First major marathon!' },
    { id: 2, date: '2024-03-03', type: 'Marathon', name: 'Tokyo Marathon', distance: '42.195km', time: '3:30:15', pace: '4:59/km', notes: 'PB achieved in chilly rain.' },
  ];

  const { data: trips, addItem: addTrip, deleteItem: deleteTrip, updateItem: updateTrip, isCloud } = useCloudStorage('trips', 'trips', initialTrips);
  const { data: sports, addItem: addSport, deleteItem: deleteSport } = useCloudStorage('sports_records', 'sports', initialSports);
  
  const [activeMap, setActiveMap] = useState('world'); // 'world' | 'china'
  const [showModal, setShowModal] = useState(false);
  const [viewingTrip, setViewingTrip] = useState(null);
  const [editingTrip, setEditingTrip] = useState(null);
  
  const [newTrip, setNewTrip] = useState({
    title: '',
    location: '',
    date: '',
    description: '',
    content: '',
    height: 'h-64',
    imageUrl: '',
    coordinates: [0, 0] // [long, lat]
  });

  const [newSport, setNewSport] = useState({
    date: '',
    type: 'Run',
    name: '',
    distance: '',
    time: '',
    pace: '',
    notes: ''
  });
  const [showSportModal, setShowSportModal] = useState(false);

  // Helper: Calculate Pace
  const calculatePace = (distanceStr, timeStr) => {
      // Clean distance: "42.195km" -> 42.195
      const distance = parseFloat(distanceStr.replace(/[^0-9.]/g, ''));
      if (!distance || distance <= 0) return '';

      // Parse time: "HH:MM:SS" or "MM:SS" or "H:MM:SS"
      const parts = timeStr.split(':').map(Number);
      let totalSeconds = 0;
      
      if (parts.length === 3) {
          totalSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
      } else if (parts.length === 2) {
          totalSeconds = parts[0] * 60 + parts[1];
      } else {
          return '';
      }

      if (isNaN(totalSeconds) || totalSeconds <= 0) return '';

      const paceSeconds = totalSeconds / distance;
      const paceMin = Math.floor(paceSeconds / 60);
      const paceSec = Math.floor(paceSeconds % 60);
      
      return `${paceMin}'${paceSec.toString().padStart(2, '0')}"/km`;
  };

  const handleSportTypeChange = (type) => {
      let distance = newSport.distance;
      if (type === 'Full Marathon') distance = '42.195km';
      else if (type === 'Half Marathon') distance = '21.0975km';
      
      const pace = calculatePace(distance, newSport.time);
      setNewSport({ ...newSport, type, distance, pace });
  };

  const handleSportDistanceChange = (val) => {
      const pace = calculatePace(val, newSport.time);
      setNewSport({ ...newSport, distance: val, pace });
  };

  const handleSportTimeChange = (val) => {
      const pace = calculatePace(newSport.distance, val);
      setNewSport({ ...newSport, time: val, pace });
  };

  const handleAutoLocation = async (isEditing = false) => {
      const targetTrip = isEditing ? editingTrip : newTrip;
      const location = targetTrip.location;
      
      if (!location) {
          alert('请先输入地点名称');
          return;
      }

      try {
          const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1`);
          const data = await response.json();
          
          if (data && data.length > 0) {
              const { lat, lon } = data[0];
              const coords = [parseFloat(lon), parseFloat(lat)];
              
              if (isEditing) {
                  setEditingTrip({ ...editingTrip, coordinates: coords });
              } else {
                  setNewTrip({ ...newTrip, coordinates: coords });
              }
              // alert(`已自动获取坐标: [${lon}, ${lat}]`);
          } else {
              alert('未找到该地点的坐标，请尝试更详细的名称 (e.g., "City, Country")');
          }
      } catch (error) {
          console.error("Geocoding error:", error);
          alert('获取坐标失败，请稍后重试');
      }
  };

  const getRandomColor = () => {
      const colors = ['bg-orange-100', 'bg-teal-100', 'bg-blue-100', 'bg-emerald-100', 'bg-red-100', 'bg-purple-100', 'bg-yellow-100'];
      return colors[Math.floor(Math.random() * colors.length)];
  };

  const handleAddTrip = (e) => {
      e.preventDefault();
      addTrip({
          id: Date.now(),
          ...newTrip,
          imageColor: getRandomColor(),
          // Ensure coordinates are numbers
          coordinates: [parseFloat(newTrip.coordinates[0]), parseFloat(newTrip.coordinates[1])]
      });
      setShowModal(false);
      setNewTrip({ title: '', location: '', date: '', description: '', content: '', height: 'h-64', imageUrl: '', coordinates: [0, 0] });
  };

  const handleUpdateTrip = (e) => {
    e.preventDefault();
    updateTrip(editingTrip);
    setEditingTrip(null);
    setViewingTrip(null); // Close view modal if open
  };

  const handleDeleteTrip = (id) => {
    if (window.confirm('确定要删除这段旅程记录吗？')) {
      deleteTrip(id);
      if (viewingTrip && viewingTrip.id === id) {
          setViewingTrip(null);
      }
    }
  };

  const handleAddSport = (e) => {
      e.preventDefault();
      addSport({
          id: Date.now(),
          ...newSport
      });
      setShowSportModal(false);
      setNewSport({ date: '', type: 'Run', name: '', distance: '', time: '', pace: '', notes: '' });
  };

  const handleDeleteSport = (id) => {
      if(window.confirm('确定要删除这条运动记录吗？')) {
          deleteSport(id);
      }
  };

  return (
    <div className="space-y-12 animate-fade-in pb-20">
      <header className="border-b border-orange-200 pb-6 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-bold text-orange-950 font-serif tracking-tight">旅游见闻 (Travel Notes)</h1>
          <p className="text-orange-800/60 mt-2 text-lg italic flex items-center gap-2">
            "点亮地球的每一个角落"
            {isCloud ? (
                <span className="inline-flex items-center gap-1 text-green-600 text-xs px-2 py-0.5 bg-green-100 rounded-full not-italic">
                    <Cloud size={10} /> Sync Active
                </span>
            ) : (
                <span className="inline-flex items-center gap-1 text-orange-600 text-xs px-2 py-0.5 bg-orange-100 rounded-full not-italic">
                    <CloudOff size={10} /> Local
                </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-4 text-orange-900/60">
           <div className="text-right hidden md:block">
             <div className="text-2xl font-bold text-orange-900">{(trips || []).length}</div>
             <div className="text-xs uppercase tracking-widest">足迹</div>
           </div>
           <div className="w-px h-8 bg-orange-200 hidden md:block"></div>
           <button 
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-800 rounded-full hover:bg-orange-200 transition-colors text-sm font-medium"
           >
             <Plus className="w-4 h-4" />
             记录足迹
           </button>
        </div>
      </header>

      {/* Map Section */}
      <div className="bg-orange-50/30 rounded-2xl p-6 border border-orange-100 shadow-inner h-[400px] md:h-[500px] overflow-hidden relative flex flex-col">
          <div className="absolute top-4 left-4 z-10 flex gap-2">
              <button 
                onClick={() => setActiveMap('world')}
                className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm flex items-center gap-1 transition-all ${activeMap === 'world' ? 'bg-orange-500 text-white' : 'bg-white/80 text-orange-800 hover:bg-white'}`}
              >
                  <Globe className="w-3 h-3" />
                  世界足迹
              </button>
              <button 
                onClick={() => setActiveMap('china')}
                className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm flex items-center gap-1 transition-all ${activeMap === 'china' ? 'bg-red-500 text-white' : 'bg-white/80 text-orange-800 hover:bg-white'}`}
              >
                  <MapIcon className="w-3 h-3" />
                  中国足迹
              </button>
          </div>

          <ComposableMap 
            projection={activeMap === 'china' ? "geoMercator" : "geoEqualEarth"}
            projectionConfig={
                activeMap === 'china' 
                ? { scale: 750, center: [105, 38] } 
                : { scale: 147 }
            }
            className="w-full h-full"
          >
            <Geographies geography={activeMap === 'china' ? chinaGeoUrl : geoUrl}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  // Generate a deterministic color for China provinces based on name length/char code
                  // to make it look "not just simple vector" (more colorful/varied)
                  const isChina = activeMap === 'china';
                  let fillColor = "#fed7aa"; // default orange-200
                  
                  if (isChina) {
                      const nameVal = geo.properties.name ? geo.properties.name.length : 0;
                      // Subtle variations of orange/red/yellow for China
                      const colors = ["#fed7aa", "#fdba74", "#fb923c", "#fca5a5", "#fcd34d", "#e2e8f0"];
                      fillColor = colors[nameVal % colors.length];
                  }

                  return (
                    <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        fill={fillColor}
                        stroke="#fff"
                        strokeWidth={0.5}
                        style={{
                        default: { outline: "none" },
                        hover: { 
                            fill: isChina ? "#ef4444" : "#fdba74", // Red hover for China, Orange for World
                            outline: "none",
                            filter: "drop-shadow(0 0 5px rgba(0,0,0,0.2))",
                            strokeWidth: 1
                        }, 
                        pressed: { fill: "#ea580c", outline: "none" }, 
                        }}
                    />
                  );
                })
              }
            </Geographies>
            {/* Markers */}
            {(trips || []).map(({ id, title, location, coordinates }) => (
              coordinates && coordinates[0] !== 0 && (
                  <Marker key={id} coordinates={coordinates}>
                    <g
                        className="group"
                        style={{ cursor: 'pointer' }}
                        onClick={() => {
                            // Find the trip and open details
                            const trip = trips.find(t => t.id === id);
                            if (trip) setViewingTrip(trip);
                        }}
                    >
                        <circle r={activeMap === 'china' ? 3 : 4} fill={activeMap === 'china' ? "#ef4444" : "#ea580c"} stroke="#fff" strokeWidth={2} className="animate-pulse" />
                        <text
                        textAnchor="middle"
                        y={-10}
                        style={{ 
                            fontFamily: "system-ui", 
                            fill: activeMap === 'china' ? "#b91c1c" : "#9a3412", 
                            fontSize: activeMap === 'china' ? "8px" : "10px", 
                            fontWeight: "bold",
                            textShadow: "0 1px 2px rgba(255,255,255,0.8)"
                        }}
                        >
                        {location.split(',')[0]}
                        </text>
                    </g>
                  </Marker>
              )
            ))}
          </ComposableMap>
      </div>

      {/* Masonry Layout for Trips */}
      <div>
        <h2 className="text-2xl font-bold text-orange-900 mb-6 flex items-center gap-2">
            <Camera className="w-6 h-6" />
            游记列表
        </h2>
        <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
            {(trips || []).map((trip) => (
            <div 
                key={trip.id} 
                className="break-inside-avoid bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group cursor-pointer border border-stone-100 relative"
                onClick={() => setViewingTrip(trip)}
            >
                <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTrip(trip.id);
                    }}
                    className="absolute top-2 right-2 z-20 p-2 bg-white/80 backdrop-blur-sm rounded-full text-stone-400 hover:text-red-500 hover:bg-white transition-all opacity-0 group-hover:opacity-100 shadow-sm"
                    title="删除记录"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
                
                <div className={`w-full ${trip.height} ${trip.imageColor} relative overflow-hidden`}>
                {trip.imageUrl ? (
                    <img src={trip.imageUrl} alt={trip.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-stone-400/50 group-hover:scale-105 transition-transform duration-700">
                        <Camera className="w-12 h-12 opacity-20" />
                    </div>
                )}
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-stone-600 shadow-sm">
                    {trip.date}
                </div>
                </div>
                
                <div className="p-6 relative">
                <div className="absolute -top-6 left-6 bg-orange-500 text-white p-3 rounded-lg shadow-lg group-hover:-translate-y-1 transition-transform">
                    <Navigation className="w-5 h-5" />
                </div>
                
                <div className="mt-4 mb-2 flex items-center gap-1 text-orange-600 text-xs font-bold uppercase tracking-wider">
                    <MapPin className="w-3 h-3" />
                    <span>{trip.location}</span>
                </div>
                
                <h3 className="text-xl font-bold text-stone-800 mb-3 font-serif group-hover:text-orange-700 transition-colors">
                    {trip.title}
                </h3>
                
                <p className="text-stone-600 text-sm leading-relaxed mb-4 line-clamp-3">
                    {trip.description}
                </p>

                <div className="pt-4 border-t border-stone-100 flex justify-between items-center">
                    <span className="text-xs text-stone-400 font-mono">阅读全文</span>
                    <span className="text-orange-600 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-[-10px] group-hover:translate-x-0 duration-300">
                    View Details →
                    </span>
                </div>
                </div>
            </div>
            ))}
        </div>
      </div>

      {/* Sports Table Section */}
      <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
          <div className="p-6 border-b border-stone-200 flex justify-between items-center bg-stone-50">
              <div>
                  <h2 className="text-xl font-bold text-stone-800 flex items-center gap-2">
                      <Activity className="w-5 h-5 text-orange-600" />
                      日常运动 & 马拉松记录
                  </h2>
                  <p className="text-stone-500 text-sm mt-1">坚持与突破的每一公里</p>
              </div>
              <button 
                onClick={() => setShowSportModal(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-white border border-stone-200 text-stone-600 rounded-lg hover:bg-stone-50 hover:text-orange-600 transition-colors text-sm font-medium shadow-sm"
              >
                  <Plus className="w-4 h-4" />
                  添加记录
              </button>
          </div>
          <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                  <thead className="text-xs text-stone-500 uppercase bg-stone-50/50 border-b border-stone-100">
                      <tr>
                          <th className="px-6 py-3 font-medium">日期</th>
                          <th className="px-6 py-3 font-medium">类型</th>
                          <th className="px-6 py-3 font-medium">赛事/名称</th>
                          <th className="px-6 py-3 font-medium">距离</th>
                          <th className="px-6 py-3 font-medium">用时</th>
                          <th className="px-6 py-3 font-medium">配速</th>
                          <th className="px-6 py-3 font-medium">备注</th>
                          <th className="px-6 py-3 font-medium text-right">操作</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                      {(sports || []).map((sport) => (
                          <tr key={sport.id} className="hover:bg-stone-50/50 transition-colors">
                              <td className="px-6 py-4 font-mono text-stone-600">{sport.date}</td>
                              <td className="px-6 py-4">
                                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${sport.type === 'Marathon' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                                      {sport.type === 'Marathon' ? <Trophy className="w-3 h-3 mr-1" /> : <Activity className="w-3 h-3 mr-1" />}
                                      {sport.type}
                                  </span>
                              </td>
                              <td className="px-6 py-4 font-medium text-stone-800">{sport.name}</td>
                              <td className="px-6 py-4 font-mono text-stone-600">{sport.distance}</td>
                              <td className="px-6 py-4 font-mono text-stone-600 flex items-center gap-1">
                                  <Timer className="w-3 h-3 text-stone-400" />
                                  {sport.time}
                              </td>
                              <td className="px-6 py-4 font-mono text-stone-600">{sport.pace}</td>
                              <td className="px-6 py-4 text-stone-500 italic max-w-xs truncate">{sport.notes}</td>
                              <td className="px-6 py-4 text-right">
                                  <button 
                                    onClick={() => handleDeleteSport(sport.id)}
                                    className="text-stone-400 hover:text-red-500 transition-colors"
                                  >
                                      <Trash2 className="w-4 h-4" />
                                  </button>
                              </td>
                          </tr>
                      ))}
                      {(sports || []).length === 0 && (
                          <tr>
                              <td colSpan="8" className="px-6 py-8 text-center text-stone-400 italic">
                                  暂无运动记录，快去跑起来吧！
                              </td>
                          </tr>
                      )}
                  </tbody>
              </table>
          </div>
      </div>

       {/* Add Trip Modal */}
       {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden animate-fade-in border border-orange-100 max-h-[90vh] flex flex-col">
                <div className="p-4 border-b border-orange-100 flex justify-between items-center bg-orange-50/50 shrink-0">
                    <h3 className="font-bold text-orange-900">记录新旅程</h3>
                    <button onClick={() => setShowModal(false)} className="text-orange-400 hover:text-orange-600">
                        <X size={20} />
                    </button>
                </div>
                <div className="overflow-y-auto p-6 space-y-4">
                    <form onSubmit={handleAddTrip} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-orange-900/60 uppercase mb-1">标题</label>
                                <input 
                                    required
                                    type="text" 
                                    className="w-full border border-orange-200 rounded p-2 text-sm focus:outline-none focus:border-orange-500"
                                    value={newTrip.title}
                                    onChange={(e) => setNewTrip({...newTrip, title: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-orange-900/60 uppercase mb-1">地点</label>
                                <div className="flex gap-2">
                                    <input 
                                        required
                                        type="text" 
                                        className="w-full border border-orange-200 rounded p-2 text-sm focus:outline-none focus:border-orange-500"
                                        value={newTrip.location}
                                        onChange={(e) => setNewTrip({...newTrip, location: e.target.value})}
                                        onBlur={() => { if(newTrip.location && newTrip.coordinates[0] === 0) handleAutoLocation(false); }}
                                    />
                                    <button 
                                        type="button"
                                        onClick={() => handleAutoLocation(false)}
                                        className="p-2 bg-orange-100 text-orange-600 rounded hover:bg-orange-200"
                                        title="自动获取坐标"
                                    >
                                        <Search size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-orange-900/60 uppercase mb-1">时间</label>
                                <input 
                                    required
                                    type="text" 
                                    className="w-full border border-orange-200 rounded p-2 text-sm focus:outline-none focus:border-orange-500"
                                    placeholder="Oct 2024"
                                    value={newTrip.date}
                                    onChange={(e) => setNewTrip({...newTrip, date: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-orange-900/60 uppercase mb-1">经度 (Longitude)</label>
                                <input 
                                    type="number" 
                                    step="0.0001"
                                    className="w-full border border-orange-200 rounded p-2 text-sm focus:outline-none focus:border-orange-500"
                                    value={newTrip.coordinates[0]}
                                    onChange={(e) => setNewTrip({...newTrip, coordinates: [e.target.value, newTrip.coordinates[1]]})}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-orange-900/60 uppercase mb-1">纬度 (Latitude)</label>
                                <input 
                                    type="number" 
                                    step="0.0001"
                                    className="w-full border border-orange-200 rounded p-2 text-sm focus:outline-none focus:border-orange-500"
                                    value={newTrip.coordinates[1]}
                                    onChange={(e) => setNewTrip({...newTrip, coordinates: [newTrip.coordinates[0], e.target.value]})}
                                />
                            </div>
                        </div>

                        <div>
                             <label className="block text-xs font-bold text-orange-900/60 uppercase mb-1">卡片高度</label>
                             <select 
                                className="w-full border border-orange-200 rounded p-2 text-sm focus:outline-none focus:border-orange-500"
                                value={newTrip.height}
                                onChange={(e) => setNewTrip({...newTrip, height: e.target.value})}
                             >
                                 <option value="h-64">Short</option>
                                 <option value="h-80">Medium</option>
                                 <option value="h-96">Tall</option>
                             </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-orange-900/60 uppercase mb-1">封面图片链接 (可选)</label>
                            <input 
                                type="url" 
                                className="w-full border border-orange-200 rounded p-2 text-sm focus:outline-none focus:border-orange-500"
                                placeholder="https://..."
                                value={newTrip.imageUrl}
                                onChange={(e) => setNewTrip({...newTrip, imageUrl: e.target.value})}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-orange-900/60 uppercase mb-1">简短描述 (卡片显示)</label>
                            <textarea 
                                required
                                rows="2"
                                className="w-full border border-orange-200 rounded p-2 text-sm focus:outline-none focus:border-orange-500 resize-none"
                                value={newTrip.description}
                                onChange={(e) => setNewTrip({...newTrip, description: e.target.value})}
                            ></textarea>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-orange-900/60 uppercase mb-1">详细游记 (支持 Markdown)</label>
                            <MarkdownEditor 
                                value={newTrip.content} 
                                onChange={(val) => setNewTrip({...newTrip, content: val})} 
                                placeholder="记录旅途中的点点滴滴..."
                                minHeight="min-h-[300px]"
                            />
                        </div>

                        <button type="submit" className="w-full bg-orange-500 text-white py-3 rounded font-medium hover:bg-orange-600 transition-colors shadow-sm">
                            发布游记
                        </button>
                    </form>
                </div>
            </div>
        </div>
      )}

      {/* Edit Trip Modal */}
      {editingTrip && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden animate-fade-in border border-orange-100 max-h-[90vh] flex flex-col">
                <div className="p-4 border-b border-orange-100 flex justify-between items-center bg-orange-50/50 shrink-0">
                    <h3 className="font-bold text-orange-900">编辑游记</h3>
                    <button onClick={() => setEditingTrip(null)} className="text-orange-400 hover:text-orange-600">
                        <X size={20} />
                    </button>
                </div>
                <div className="overflow-y-auto p-6 space-y-4">
                    <form onSubmit={handleUpdateTrip} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-orange-900/60 uppercase mb-1">标题</label>
                                <input 
                                    required
                                    type="text" 
                                    className="w-full border border-orange-200 rounded p-2 text-sm focus:outline-none focus:border-orange-500"
                                    value={editingTrip.title}
                                    onChange={(e) => setEditingTrip({...editingTrip, title: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-orange-900/60 uppercase mb-1">地点</label>
                                <div className="flex gap-2">
                                    <input 
                                        required
                                        type="text" 
                                        className="w-full border border-orange-200 rounded p-2 text-sm focus:outline-none focus:border-orange-500"
                                        value={editingTrip.location}
                                        onChange={(e) => setEditingTrip({...editingTrip, location: e.target.value})}
                                        onBlur={() => { if(editingTrip.location && (!editingTrip.coordinates || editingTrip.coordinates[0] === 0)) handleAutoLocation(true); }}
                                    />
                                    <button 
                                        type="button"
                                        onClick={() => handleAutoLocation(true)}
                                        className="p-2 bg-orange-100 text-orange-600 rounded hover:bg-orange-200"
                                        title="自动获取坐标"
                                    >
                                        <Search size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-orange-900/60 uppercase mb-1">时间</label>
                                <input 
                                    required
                                    type="text" 
                                    className="w-full border border-orange-200 rounded p-2 text-sm focus:outline-none focus:border-orange-500"
                                    placeholder="Oct 2024"
                                    value={editingTrip.date}
                                    onChange={(e) => setEditingTrip({...editingTrip, date: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-orange-900/60 uppercase mb-1">经度 (Longitude)</label>
                                <input 
                                    type="number" 
                                    step="0.0001"
                                    className="w-full border border-orange-200 rounded p-2 text-sm focus:outline-none focus:border-orange-500"
                                    value={editingTrip.coordinates ? editingTrip.coordinates[0] : 0}
                                    onChange={(e) => setEditingTrip({...editingTrip, coordinates: [parseFloat(e.target.value), editingTrip.coordinates[1]]})}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-orange-900/60 uppercase mb-1">纬度 (Latitude)</label>
                                <input 
                                    type="number" 
                                    step="0.0001"
                                    className="w-full border border-orange-200 rounded p-2 text-sm focus:outline-none focus:border-orange-500"
                                    value={editingTrip.coordinates ? editingTrip.coordinates[1] : 0}
                                    onChange={(e) => setEditingTrip({...editingTrip, coordinates: [editingTrip.coordinates[0], parseFloat(e.target.value)]})}
                                />
                            </div>
                        </div>

                        <div>
                             <label className="block text-xs font-bold text-orange-900/60 uppercase mb-1">卡片高度</label>
                             <select 
                                className="w-full border border-orange-200 rounded p-2 text-sm focus:outline-none focus:border-orange-500"
                                value={editingTrip.height}
                                onChange={(e) => setEditingTrip({...editingTrip, height: e.target.value})}
                             >
                                 <option value="h-64">Short</option>
                                 <option value="h-80">Medium</option>
                                 <option value="h-96">Tall</option>
                             </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-orange-900/60 uppercase mb-1">封面图片链接 (可选)</label>
                            <input 
                                type="url" 
                                className="w-full border border-orange-200 rounded p-2 text-sm focus:outline-none focus:border-orange-500"
                                placeholder="https://..."
                                value={editingTrip.imageUrl || ''}
                                onChange={(e) => setEditingTrip({...editingTrip, imageUrl: e.target.value})}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-orange-900/60 uppercase mb-1">简短描述 (卡片显示)</label>
                            <textarea 
                                required
                                rows="2"
                                className="w-full border border-orange-200 rounded p-2 text-sm focus:outline-none focus:border-orange-500 resize-none"
                                value={editingTrip.description}
                                onChange={(e) => setEditingTrip({...editingTrip, description: e.target.value})}
                            ></textarea>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-orange-900/60 uppercase mb-1">详细游记 (支持 Markdown)</label>
                            <MarkdownEditor 
                                value={editingTrip.content || ''} 
                                onChange={(val) => setEditingTrip({...editingTrip, content: val})} 
                                placeholder="记录旅途中的点点滴滴..."
                                minHeight="min-h-[300px]"
                            />
                        </div>

                        <button type="submit" className="w-full bg-orange-500 text-white py-3 rounded font-medium hover:bg-orange-600 transition-colors shadow-sm">
                            保存修改
                        </button>
                    </form>
                </div>
            </div>
        </div>
      )}

      {/* Add Sport Modal */}
      {showSportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-fade-in">
                <div className="p-4 border-b border-stone-200 flex justify-between items-center bg-stone-50">
                    <h3 className="font-bold text-stone-800">添加运动记录</h3>
                    <button onClick={() => setShowSportModal(false)} className="text-stone-400 hover:text-stone-600">
                        <X size={20} />
                    </button>
                </div>
                <form onSubmit={handleAddSport} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-stone-500 uppercase mb-1">日期</label>
                            <input 
                                required
                                type="date" 
                                className="w-full border border-stone-200 rounded p-2 text-sm focus:outline-none focus:border-orange-500"
                                value={newSport.date}
                                onChange={(e) => setNewSport({...newSport, date: e.target.value})}
                            />
                        </div>
                         <div>
                            <label className="block text-xs font-bold text-stone-500 uppercase mb-1">类型</label>
                            <select 
                                className="w-full border border-stone-200 rounded p-2 text-sm focus:outline-none focus:border-orange-500"
                                value={newSport.type}
                                onChange={(e) => setNewSport({...newSport, type: e.target.value})}
                            >
                                <option value="Run">跑步</option>
                                <option value="Marathon">马拉松</option>
                                <option value="Hike">徒步</option>
                                <option value="Cycling">骑行</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-stone-500 uppercase mb-1">赛事/活动名称</label>
                        <input 
                            required
                            type="text" 
                            className="w-full border border-stone-200 rounded p-2 text-sm focus:outline-none focus:border-orange-500"
                            placeholder="e.g. Shanghai Marathon"
                            value={newSport.name}
                            onChange={(e) => setNewSport({...newSport, name: e.target.value})}
                        />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-stone-500 uppercase mb-1">距离 (km)</label>
                            <input 
                                required
                                type="text" 
                                className="w-full border border-stone-200 rounded p-2 text-sm focus:outline-none focus:border-orange-500"
                                placeholder="42.195"
                                value={newSport.distance}
                                onChange={(e) => handleSportDistanceChange(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-stone-500 uppercase mb-1">用时 (H:MM:SS)</label>
                            <input 
                                required
                                type="text" 
                                className="w-full border border-stone-200 rounded p-2 text-sm focus:outline-none focus:border-orange-500"
                                placeholder="3:30:00"
                                value={newSport.time}
                                onChange={(e) => handleSportTimeChange(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-stone-500 uppercase mb-1">配速 (自动计算)</label>
                            <input 
                                type="text" 
                                className="w-full border border-stone-200 rounded p-2 text-sm bg-stone-50 text-stone-500 focus:outline-none"
                                placeholder="5'00&quot;/km"
                                value={newSport.pace}
                                readOnly
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-stone-500 uppercase mb-1">备注</label>
                        <textarea 
                            rows="2"
                            className="w-full border border-stone-200 rounded p-2 text-sm focus:outline-none focus:border-orange-500 resize-none"
                            value={newSport.notes}
                            onChange={(e) => setNewSport({...newSport, notes: e.target.value})}
                        ></textarea>
                    </div>
                    <button type="submit" className="w-full bg-orange-500 text-white py-2 rounded font-medium hover:bg-orange-600 transition-colors">
                        添加记录
                    </button>
                </form>
            </div>
        </div>
      )}

      {/* View Trip Modal */}
      {viewingTrip && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl overflow-hidden animate-fade-in border border-stone-200 max-h-[90vh] flex flex-col">
                  <div className="p-4 border-b border-stone-200 flex justify-between items-center bg-stone-50 shrink-0">
                      <div className="flex items-center gap-2">
                          <MapIcon className="text-orange-600" size={24} />
                          <h3 className="font-bold text-stone-800 text-lg">{viewingTrip.title}</h3>
                      </div>
                      <button onClick={() => setViewingTrip(null)} className="text-stone-400 hover:text-stone-600">
                          <X size={24} />
                      </button>
                  </div>
                  <div className="p-8 overflow-y-auto flex-1 bg-white">
                      {viewingTrip.imageUrl && (
                        <div className="mb-6 rounded-xl overflow-hidden shadow-md max-h-96 w-full">
                          <img src={viewingTrip.imageUrl} alt={viewingTrip.title} className="w-full h-full object-cover" />
                        </div>
                      )}
                      
                      <div className="flex items-center gap-4 mb-8 text-sm text-stone-500 border-b border-stone-100 pb-4">
                        <span className="flex items-center gap-1 bg-orange-50 px-2 py-1 rounded text-orange-700">
                          <Calendar className="w-4 h-4" />
                          {viewingTrip.date}
                        </span>
                        <span className="flex items-center gap-1 bg-stone-100 px-2 py-1 rounded">
                          <MapPin className="w-4 h-4" />
                          {viewingTrip.location}
                        </span>
                      </div>

                      <div className="prose prose-stone max-w-none">
                          <ReactMarkdown
                              remarkPlugins={[remarkGfm, remarkMath]}
                              rehypePlugins={[rehypeKatex]}
                              components={{
                                  img: ({node, ...props}) => (
                                      <img {...props} className="rounded-lg shadow-sm max-h-96 mx-auto" alt={props.alt || ''} />
                                  )
                              }}
                          >
                              {viewingTrip.content || viewingTrip.description || '*暂无详细内容*'}
                          </ReactMarkdown>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Travel;
