import React, { useState, useEffect, useMemo, useRef } from 'react';
import Map, { Source, Layer, MapRef, Marker, Popup } from 'react-map-gl/mapbox';
import type { SymbolLayer, CircleLayer } from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { dash_getWorldMapData, formatCurrency, CURRENCY_MAP } from '../../services/supabaseService';
import { RefreshCwIcon, DownloadIcon } from '../icons/Icons'; 
import InfographicModal from '../InfographicModal';

interface PubMapData {
    id: string;
    name: string;
    lat: number;
    lng: number;
    area_identifier: string | null;
    country_code: string | null;
    ratings_count: number;
    avg_score: number | null;
    avg_quality: number | null;
    min_price: number | null;
    max_price: number | null;
}

const clusterLayer: CircleLayer = {
  id: 'clusters',
  type: 'circle',
  source: 'pubs',
  filter: ['has', 'point_count'],
  paint: {
    'circle-color': ['step', ['get', 'point_count'], '#FBBF24', 10, '#F59E0B', 50, '#D97706'],
    'circle-radius': ['step', ['get', 'point_count'], 20, 10, 30, 50, 40],
    'circle-stroke-width': 2,
    'circle-stroke-color': '#1E293B'
  }
};

const clusterCountLayer: SymbolLayer = {
  id: 'cluster-count',
  type: 'symbol',
  source: 'pubs',
  filter: ['has', 'point_count'],
  layout: {
    'text-field': '{point_count_abbreviated}',
    'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
    'text-size': 14
  },
  paint: {
    'text-color': '#1E293B'
  }
};

const unclusteredPointLayer: CircleLayer = {
  id: 'unclustered-point',
  type: 'circle',
  source: 'pubs',
  filter: ['!', ['has', 'point_count']],
  paint: {
    'circle-color': '#F59E0B',
    'circle-radius': 8,
    'circle-stroke-width': 2,
    'circle-stroke-color': '#1E293B'
  }
};

export default function WorldMap({ refreshKey }: { refreshKey: number }) {
    const mapRef = useRef<MapRef>(null);
    const [data, setData] = useState<PubMapData[]>([]);
    const [loading, setLoading] = useState(true);
    const [stoutlyMode, setStoutlyMode] = useState(false);
    const [selectedCluster, setSelectedCluster] = useState<any>(null);
    const [selectedPub, setSelectedPub] = useState<PubMapData | null>(null);
    const [infographicModalOpen, setInfographicModalOpen] = useState(false);
    const [infographicClusterTarget, setInfographicClusterTarget] = useState<any>(null);

    useEffect(() => {
        const fetchMap = async () => {
            setLoading(true);
            const pubs = await dash_getWorldMapData();
            setData(pubs);
            setLoading(false);
        };
        fetchMap();
    }, [refreshKey]);

    const geojson = useMemo(() => {
        return {
            type: 'FeatureCollection',
            features: data.map(pub => ({
                type: 'Feature',
                properties: {
                    ...pub,
                    cluster: false // Mapbox GL handles clustering
                },
                geometry: {
                    type: 'Point',
                    coordinates: [pub.lng, pub.lat]
                }
            }))
        };
    }, [data]);

    const onClick = (event: mapboxgl.MapLayerMouseEvent) => {
        const feature = event.features?.[0];
        if (!feature) {
            setSelectedCluster(null);
            setSelectedPub(null);
            return;
        }

        const clusterId = feature.properties?.cluster_id;
        if (clusterId) {
            const mapboxSource = mapRef.current?.getSource('pubs') as mapboxgl.GeoJSONSource;
            
            mapboxSource.getClusterExpansionZoom(clusterId, (err, zoom) => {
                if (err) return;
                
                // We'll also get the leaves to show stats!
                mapboxSource.getClusterLeaves(clusterId, 1000, 0, (err, leaves) => {
                    if (err) return;
                    // Compute stats for cluster
                    const pubsInCluster = leaves.map(l => l.properties as PubMapData);
                    
                    const cheapest = [...pubsInCluster].filter(p => p.min_price != null).sort((a, b) => a.min_price! - b.min_price!).slice(0, 10);
                    const expensive = [...pubsInCluster].filter(p => p.max_price != null).sort((a, b) => b.max_price! - a.max_price!).slice(0, 10);
                    const topRated = [...pubsInCluster].filter(p => p.avg_score != null).sort((a, b) => b.avg_score! - a.avg_score!).slice(0, 10);
                    
                    let sum = 0;
                    let count = 0;
                    pubsInCluster.forEach(p => {
                        if (p.min_price != null) {
                            sum += p.min_price;
                            count++;
                        }
                    });
                    const avgPrice = count > 0 ? sum / count : null;
                    const clusterCountryCode = pubsInCluster.length > 0 ? pubsInCluster[0].country_code : null;
                    const currency = clusterCountryCode ? (CURRENCY_MAP[clusterCountryCode.toUpperCase()]?.symbol || '£') : '£';
                    
                    let countrySum = 0;
                    let countryCount = 0;
                    if (clusterCountryCode) {
                        data.forEach(p => {
                            if (p.country_code === clusterCountryCode && p.min_price != null) {
                                countrySum += p.min_price;
                                countryCount++;
                            }
                        });
                    }
                    const countryAvgPrice = countryCount > 0 ? countrySum / countryCount : null;
                    
                    setSelectedCluster({
                        count: pubsInCluster.length,
                        lng: feature.geometry.coordinates[0],
                        lat: feature.geometry.coordinates[1],
                        pubs: pubsInCluster,
                        cheapest,
                        expensive,
                        topRated,
                        avgPrice,
                        countryAvgPrice,
                        currency
                    });
                });

                if (mapRef.current) {
                    mapRef.current.easeTo({
                        center: feature.geometry.coordinates as [number, number],
                        zoom: zoom + 1,
                        duration: 500
                    });
                }
            });
        } else {
            // Unclustered point
            setSelectedPub(feature.properties as PubMapData);
        }
    };

    const token = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || import.meta.env.VITE_MAPBOX_API_KEY || '';

    if (!token) {
        return (
            <div className="flex flex-col items-center justify-center h-96 bg-surface rounded-xl border border-border/50">
                <div className="text-xl font-bold mb-2">Mapbox Token Missing</div>
                <div className="text-text-secondary text-center max-w-md">
                    Please provide VITE_MAPBOX_ACCESS_TOKEN or VITE_MAPBOX_API_KEY in the environment variables to use the World Map.
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-3xl font-bold text-text-primary tracking-tight">World Map</h2>
                
                <div className="flex items-center space-x-4">
                    <button 
                        onClick={() => {
                            setInfographicClusterTarget(null);
                            setInfographicModalOpen(true);
                        }}
                        className="bg-primary hover:bg-primary-hover text-background font-bold px-4 py-2 rounded-lg border border-border/50 flex items-center space-x-2 transition-colors"
                    >
                        <DownloadIcon className="w-4 h-4" />
                        <span className="text-sm">Infographic</span>
                    </button>
                    <label className="flex items-center space-x-2 cursor-pointer bg-surface px-4 py-2 rounded-lg border border-border/50">
                        <span className="text-sm font-medium">Stoutly Mode (Pins only)</span>
                        <input 
                            type="checkbox" 
                            checked={stoutlyMode} 
                            onChange={(e) => setStoutlyMode(e.target.checked)}
                            className="rounded border-border text-primary focus:ring-primary"
                        />
                    </label>
                    <div className="bg-surface px-4 py-2 rounded-lg border border-border/50 text-sm font-medium">
                        Total Pubs: <span className="text-primary font-bold">{data.length}</span>
                    </div>
                </div>
            </div>

            <div className="h-[700px] w-full rounded-xl overflow-hidden border border-border/50 shadow-lg relative">
                {loading && (
                    <div className="absolute inset-0 z-10 bg-background/50 flex flex-col items-center justify-center">
                        <RefreshCwIcon className="w-8 h-8 animate-spin text-primary mb-2" />
                        <span className="font-semibold text-lg drop-shadow-md">Loading map data...</span>
                    </div>
                )}
                
                <Map
                    ref={mapRef}
                    initialViewState={{
                        longitude: -3.4,
                        latitude: 54.3,
                        zoom: 4.5
                    }}
                    mapStyle="mapbox://styles/mapbox/dark-v11"
                    mapboxAccessToken={token}
                    projection="mercator"
                    interactiveLayerIds={!stoutlyMode ? [clusterLayer.id, unclusteredPointLayer.id] : undefined}
                    onClick={!stoutlyMode ? onClick : undefined}
                    cursor={selectedCluster || selectedPub ? 'pointer' : 'grab'}
                >
                    {!stoutlyMode ? (
                        <Source 
                            id="pubs" 
                            type="geojson" 
                            data={geojson as any}
                            cluster={true}
                            clusterMaxZoom={14}
                            clusterRadius={50}
                        >
                            <Layer {...clusterLayer} />
                            <Layer {...clusterCountLayer} />
                            <Layer {...unclusteredPointLayer} />
                        </Source>
                    ) : (
                        data.map(pub => (
                            <Marker 
                                key={pub.id} 
                                longitude={pub.lng} 
                                latitude={pub.lat}
                                onClick={(e) => {
                                    e.originalEvent.stopPropagation();
                                    setSelectedPub(pub);
                                }}
                            >
                                <div className="w-10 h-10 cursor-pointer drop-shadow-lg relative">
                                    <svg className="w-full h-full" viewBox="0 0 24 24">
                                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#F59E0B" stroke="#000" strokeWidth="1" />
                                    </svg>
                                </div>
                            </Marker>
                        ))
                    )}

                    {selectedCluster && !stoutlyMode && (
                        <Popup
                            longitude={selectedCluster.lng}
                            latitude={selectedCluster.lat}
                            onClose={() => setSelectedCluster(null)}
                            closeButton={true}
                            closeOnClick={false}
                            className="cluster-popup"
                            maxWidth="400px"
                        >
                            <div className="p-5 max-h-[400px] overflow-y-auto text-sm text-[#FDEED4]">
                                <div className="flex justify-between items-start mb-4 pr-4 border-b border-[#374151] pb-2">
                                    <h3 className="font-bold text-xl">Cluster area ({selectedCluster.count} pubs)</h3>
                                    <button 
                                        onClick={() => {
                                            setInfographicClusterTarget(selectedCluster);
                                            setInfographicModalOpen(true);
                                        }}
                                        className="bg-[#10B981]/20 hover:bg-[#10B981]/40 text-[#10B981] px-3 py-1 rounded font-medium text-xs flex items-center gap-1 transition-colors border border-[#10B981]/50 whitespace-nowrap"
                                    >
                                        <DownloadIcon className="w-3 h-3" /> Infographic
                                    </button>
                                </div>
                                
                                {selectedCluster.avgPrice != null && (
                                    <div className="mb-4 bg-[#111827]/50 rounded-lg p-3 border border-[#374151] flex flex-col gap-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[#9CA3AF] font-medium">Area Avg Price:</span>
                                            <span className="font-bold text-lg text-[#10B981]">{selectedCluster.currency}{selectedCluster.avgPrice.toFixed(2)}</span>
                                        </div>
                                        {selectedCluster.countryAvgPrice != null && (
                                            <div className="flex justify-between items-center pt-2 border-t border-[#374151]/50">
                                                <span className="text-[#9CA3AF] font-medium">Country Avg Price:</span>
                                                <span className="font-bold text-md text-[#10B981]">{selectedCluster.currency}{selectedCluster.countryAvgPrice.toFixed(2)}</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                                
                                {selectedCluster.cheapest.length > 0 && (
                                    <div className="mb-4">
                                        <h4 className="font-semibold pb-1 mb-2 text-[#10B981] flex items-center gap-1">
                                            <span>Top Cheapest</span>
                                        </h4>
                                        <ul className="space-y-1.5 border-l-2 border-[#10B981]/30 pl-2">
                                            {selectedCluster.cheapest.map((p: any) => (
                                                <li key={`cheap-${p.id}`} className="flex justify-between items-center bg-[#111827]/30 px-2 py-1 rounded">
                                                    <span className="truncate pr-3 w-3/4">{p.name}</span>
                                                    <span className="font-mono text-[#10B981]">{CURRENCY_MAP[p.country_code?.toUpperCase() || 'GB']?.symbol || '£'}{p.min_price?.toFixed(2)}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {selectedCluster.expensive.length > 0 && (
                                    <div className="mb-4">
                                        <h4 className="font-semibold pb-1 mb-2 text-[#DC2626] flex items-center gap-1">
                                            <span>Top Expensive</span>
                                        </h4>
                                        <ul className="space-y-1.5 border-l-2 border-[#DC2626]/30 pl-2">
                                            {selectedCluster.expensive.map((p: any) => (
                                                <li key={`exp-${p.id}`} className="flex justify-between items-center bg-[#111827]/30 px-2 py-1 rounded">
                                                    <span className="truncate pr-3 w-3/4">{p.name}</span>
                                                    <span className="font-mono text-[#DC2626]">{CURRENCY_MAP[p.country_code?.toUpperCase() || 'GB']?.symbol || '£'}{p.max_price?.toFixed(2)}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {selectedCluster.topRated.length > 0 && (
                                    <div className="mb-2">
                                        <h4 className="font-semibold pb-1 mb-2 text-[#F59E0B] flex items-center gap-1">
                                            <span>Top Rated</span>
                                        </h4>
                                        <ul className="space-y-1.5 border-l-2 border-[#F59E0B]/30 pl-2">
                                            {selectedCluster.topRated.map((p: any) => (
                                                <li key={`rate-${p.id}`} className="flex justify-between items-center bg-[#111827]/30 px-2 py-1 rounded">
                                                    <span className="truncate pr-3 w-3/4">{p.name}</span>
                                                    <span className="font-bold text-[#F59E0B]">{p.avg_score?.toFixed(0)}<span className="text-xs text-[#9CA3AF] opacity-80">/100</span></span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </Popup>
                    )}

                    {selectedPub && (
                        <Popup
                            longitude={selectedPub.lng}
                            latitude={selectedPub.lat}
                            onClose={() => setSelectedPub(null)}
                            closeButton={true}
                            closeOnClick={false}
                        >
                            <div className="p-5 text-sm text-[#FDEED4]">
                                <h3 className="font-bold text-xl mb-3 pr-6 text-[#F59E0B] leading-tight">{selectedPub.name}</h3>
                                
                                <div className="space-y-2.5">
                                    <div className="flex justify-between items-center bg-[#111827]/50 px-3 py-2 rounded-lg border border-[#374151]/50">
                                        <span className="text-[#9CA3AF]">Total Ratings</span>
                                        <span className="font-semibold">{selectedPub.ratings_count}</span>
                                    </div>
                                    
                                    {selectedPub.avg_score != null && (
                                        <div className="flex justify-between items-center bg-[#111827]/50 px-3 py-2 rounded-lg border border-[#374151]/50 shadow-[inset_0px_0px_5px_rgba(245,158,11,0.1)]">
                                            <span className="text-[#9CA3AF] font-medium text-[#F59E0B]">Stoutly Score</span>
                                            <span className="font-bold text-lg text-[#F59E0B]">{selectedPub.avg_score.toFixed(0)}<span className="text-sm text-[#9CA3AF] font-normal opacity-80">/100</span></span>
                                        </div>
                                    )}
                                    
                                    {selectedPub.min_price != null && (
                                        <div className="flex justify-between items-center bg-[#111827]/50 px-3 py-2 rounded-lg border border-[#374151]/50">
                                            <span className="text-[#9CA3AF]">Price Range</span>
                                            <span className="font-mono text-[#10B981]">{CURRENCY_MAP[selectedPub.country_code?.toUpperCase() || 'GB']?.symbol || '£'}{selectedPub.min_price.toFixed(2)} - {CURRENCY_MAP[selectedPub.country_code?.toUpperCase() || 'GB']?.symbol || '£'}{selectedPub.max_price?.toFixed(2)}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Popup>
                    )}
                </Map>
            </div>
            
            <style dangerouslySetInnerHTML={{__html: `
                .mapboxgl-popup-content {
                    background-color: #1F2937 !important;
                    color: #FDEED4 !important;
                    border: 1px solid #374151 !important;
                    border-radius: 1rem !important;
                    padding: 0 !important;
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5) !important;
                    overflow: hidden;
                }
                .mapboxgl-popup-anchor-top .mapboxgl-popup-tip,
                .mapboxgl-popup-anchor-top-left .mapboxgl-popup-tip,
                .mapboxgl-popup-anchor-top-right .mapboxgl-popup-tip {
                    border-bottom-color: #374151 !important;
                }
                .mapboxgl-popup-anchor-bottom .mapboxgl-popup-tip,
                .mapboxgl-popup-anchor-bottom-left .mapboxgl-popup-tip,
                .mapboxgl-popup-anchor-bottom-right .mapboxgl-popup-tip {
                    border-top-color: #374151 !important;
                }
                .mapboxgl-popup-anchor-left .mapboxgl-popup-tip {
                    border-right-color: #374151 !important;
                }
                .mapboxgl-popup-anchor-right .mapboxgl-popup-tip {
                    border-left-color: #374151 !important;
                }
                .mapboxgl-popup-close-button {
                    color: #9CA3AF !important;
                    font-size: 1.5rem !important;
                    padding: 4px 10px !important;
                    border-bottom-left-radius: 0.5rem !important;
                    transition: all 0.2s;
                    z-index: 10;
                }
                .mapboxgl-popup-close-button:hover {
                    background-color: #DC2626 !important;
                    color: #FFFFFF !important;
                }
            `}} />
            
            <InfographicModal 
                isOpen={infographicModalOpen}
                onClose={() => setInfographicModalOpen(false)}
                allPubs={data}
                initialCluster={infographicClusterTarget}
            />
        </div>
    );
}

