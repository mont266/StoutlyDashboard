



import React, { useState, useEffect, useCallback } from 'react';
import { dash_getContentInitialData, getRatingsData, getCommentsData, getImagesData, getAvatarUrl, formatCurrency, CURRENCY_MAP } from '../../services/supabaseService';
import type { Rating, Comment, UploadedImage } from '../../types';
import { StarIcon, MessageSquareIcon, CameraIcon, BeerIcon, DollarSignIcon, RefreshCwIcon, DownloadIcon, QuoteIcon, EuroIcon, PoundSterlingIcon, JapaneseYenIcon, IndianRupeeIcon, TurkishLiraIcon, ShekelIcon, RussianRubleIcon, CoinsIcon } from '../icons/Icons';

type SubTab = 'ratings' | 'comments' | 'images';

const PLACEHOLDER_AVATAR = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM5Q0EzQUYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMTYgMjF2LTJhNCA0IDAgMCAwLTQtNEg2YTQgNCAwIDAgMC00IDR2MiI+PC9wYXRoPjxjaXJjbGUgY3g9IjkiIGN5PSI3IiByPSI0Ij48L2NpcmNsZT48L3N2Zz4=`;

interface ContentProps {
    refreshKey: number;
}

const Content: React.FC<ContentProps> = ({ refreshKey }) => {
    const [subTab, setSubTab] = useState<SubTab>('ratings');
    
    // State for initial load
    const [initialLoading, setInitialLoading] = useState(true);

    // State for ratings
    const [ratings, setRatings] = useState<Rating[]>([]);
    const [ratingsPage, setRatingsPage] = useState(1);
    const [hasMoreRatings, setHasMoreRatings] = useState(true);
    const [loadingRatings, setLoadingRatings] = useState(false);

    // State for comments
    const [comments, setComments] = useState<Comment[]>([]);
    const [commentsPage, setCommentsPage] = useState(1);
    const [hasMoreComments, setHasMoreComments] = useState(true);
    const [loadingComments, setLoadingComments] = useState(false);
    
    // State for images with server-side pagination
    const [images, setImages] = useState<UploadedImage[]>([]);
    const [imagesPage, setImagesPage] = useState(1);
    const [hasMoreImages, setHasMoreImages] = useState(true);
    const [loadingImages, setLoadingImages] = useState(false);
    const [totalImages, setTotalImages] = useState(0);
    const [imagesPerPage, setImagesPerPage] = useState(9);
    
    const [selectedImage, setSelectedImage] = useState<UploadedImage | null>(null);
    const ITEMS_PER_PAGE = 15;

    const fetchInitialData = useCallback(async () => {
        setInitialLoading(true);
        try {
            // Use the new consolidated function for an efficient initial load
            const [initialRatings, initialComments, initialImagesData] = await Promise.all([
                getRatingsData(1, ITEMS_PER_PAGE),
                getCommentsData(1, ITEMS_PER_PAGE),
                dash_getContentInitialData() // Still use this for images count and initial images
            ]);

            setRatings(initialRatings);
            setHasMoreRatings(initialRatings.length === ITEMS_PER_PAGE);
            setRatingsPage(2);

            setComments(initialComments);
            setHasMoreComments(initialComments.length === ITEMS_PER_PAGE);
            setCommentsPage(2);

            setImages(initialImagesData.images);
            setTotalImages(initialImagesData.totalImages);
            setHasMoreImages(initialImagesData.images.length === imagesPerPage);
            setImagesPage(1);
        } catch (error) {
            console.error("Failed to fetch initial content data", error);
            setHasMoreRatings(false);
            setHasMoreComments(false);
            setHasMoreImages(false);
        } finally {
            setInitialLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchInitialData();
    }, [fetchInitialData, refreshKey]);

    useEffect(() => {
        if (!initialLoading) { // Avoid running on initial mount
            fetchImageData(1);
        }
    }, [imagesPerPage]);

    const loadRatings = async () => {
        if (loadingRatings || !hasMoreRatings) return;
        setLoadingRatings(true);
        try {
            const newRatings = await getRatingsData(ratingsPage, ITEMS_PER_PAGE);
            setRatings(prev => [...prev, ...newRatings]);
            setRatingsPage(prev => prev + 1);
            if (newRatings.length < ITEMS_PER_PAGE) {
                setHasMoreRatings(false);
            }
        } catch (error) {
            console.error("Failed to load ratings", error);
        } finally {
            setLoadingRatings(false);
        }
    };

    const loadComments = async () => {
        if (loadingComments || !hasMoreComments) return;
        setLoadingComments(true);
        try {
            const newComments = await getCommentsData(commentsPage, ITEMS_PER_PAGE);
            setComments(prev => [...prev, ...newComments]);
            setCommentsPage(prev => prev + 1);
            if (newComments.length < ITEMS_PER_PAGE) {
                setHasMoreComments(false);
            }
        } catch (error) {
            console.error("Failed to load comments", error);
        } finally {
            setLoadingComments(false);
        }
    };
    
    const fetchImageData = async (page: number) => {
        if (page < 1) return;
        setLoadingImages(true);
        try {
            const newImages = await getImagesData(page, imagesPerPage);
            setImages(newImages);
            setImagesPage(page);
            setHasMoreImages(newImages.length === imagesPerPage);
        } catch (error) {
            console.error(`Failed to fetch images for page ${page}`, error);
        } finally {
            setLoadingImages(false);
        }
    };
    
     const subTabs: { id: SubTab; label: string, icon: React.ReactNode }[] = [
        { id: 'ratings', label: 'Ratings Feed', icon: <StarIcon /> },
        { id: 'comments', label: 'Comments Feed', icon: <MessageSquareIcon /> },
        { id: 'images', label: 'Image Gallery', icon: <CameraIcon /> },
    ];

    const renderContent = () => {
        switch (subTab) {
            case 'ratings':
                return <RatingsFeed ratings={ratings} onLoadMore={loadRatings} hasMore={hasMoreRatings} isLoadingMore={loadingRatings} initialLoading={initialLoading} />;
            case 'comments':
                return <CommentsFeed comments={comments} onLoadMore={loadComments} hasMore={hasMoreComments} isLoadingMore={loadingComments} initialLoading={initialLoading} />;
            case 'images':
                return <ImageGallery images={images} page={imagesPage} setPage={fetchImageData} hasMore={hasMoreImages} isLoading={loadingImages} onImageClick={setSelectedImage} initialLoading={initialLoading} totalImages={totalImages} imagesPerPage={imagesPerPage} setImagesPerPage={setImagesPerPage} />;
            default:
                return null;
        }
    };

    return (
        <section>
            <div className="flex items-center space-x-4 mb-6">
                <h2 className="text-2xl font-bold">Content Feeds</h2>
                <button
                    onClick={fetchInitialData}
                    disabled={initialLoading}
                    className="text-text-secondary hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    aria-label="Refresh data"
                >
                    <RefreshCwIcon className={initialLoading ? 'animate-spin' : ''} />
                </button>
            </div>
            
            <div className="flex space-x-2 border-b border-border overflow-x-auto pb-px">
                {subTabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setSubTab(tab.id)}
                        className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors duration-200 shrink-0 ${
                            subTab === tab.id
                                ? 'border-primary text-primary'
                                : 'border-transparent text-text-secondary hover:text-text-primary'
                        }`}
                    >
                        {tab.icon}
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>
            
            <div className="mt-6">
                {renderContent()}
            </div>

            {selectedImage && <ImageModal image={selectedImage} onClose={() => setSelectedImage(null)} />}
        </section>
    );
};


const RatingDetail: React.FC<{ score?: number, icon: React.ReactNode, name: string }> = ({ score, icon, name }) => {
    if (score === undefined) return null;
    return (
        <div className="flex flex-col items-center space-y-1 text-xs text-text-secondary">
            <div className="h-5 w-5">{icon}</div>
            <span className="font-semibold text-text-primary">{score.toFixed(1)}</span>
            <span>{name}</span>
        </div>
    );
};

const getCurrencyIcon = (countryCode?: string) => {
    if (!countryCode) return <DollarSignIcon />;
    
    const currency = CURRENCY_MAP[countryCode.toUpperCase()];
    if (!currency) return <DollarSignIcon />;

    switch (currency.code) {
        case 'EUR': return <EuroIcon />;
        case 'GBP': return <PoundSterlingIcon />;
        case 'USD': 
        case 'AUD': 
        case 'CAD': 
        case 'NZD': 
        case 'MXN': 
            return <DollarSignIcon />;
        case 'JPY': return <JapaneseYenIcon />;
        case 'INR': return <IndianRupeeIcon />;
        case 'TRY': return <TurkishLiraIcon />;
        case 'ILS': return <ShekelIcon />;
        case 'RUB': return <RussianRubleIcon />;
        default: return <CoinsIcon />;
    }
};

const RatingsFeed: React.FC<{ ratings: Rating[], onLoadMore: () => void, hasMore: boolean, isLoadingMore: boolean, initialLoading: boolean }> = ({ ratings, onLoadMore, hasMore, isLoadingMore, initialLoading }) => {
    if (initialLoading) {
        return (
            <div className="bg-surface rounded-xl shadow-lg p-2 sm:p-4 space-y-4 max-w-3xl mx-auto animate-pulse">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="bg-background p-4 rounded-lg border border-border">
                        <div className="flex space-x-4">
                            <div className="w-10 h-10 rounded-full bg-border flex-shrink-0"></div>
                            <div className="flex-grow space-y-2">
                                <div className="h-4 bg-border rounded w-3/4"></div>
                                <div className="h-3 bg-border rounded w-1/2"></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }
    
    const showEmptyState = ratings.length === 0 && !isLoadingMore;

    return (
        <div className="bg-surface rounded-xl shadow-lg p-2 sm:p-4 space-y-4 max-w-3xl mx-auto">
            {showEmptyState && (
                <div className="text-center py-12 text-text-secondary">
                    <StarIcon />
                    <p className="mt-2 font-semibold">No Ratings Yet</p>
                    <p className="text-sm">When users submit ratings, they'll appear here.</p>
                </div>
            )}
            {ratings.map(rating => {
                const avatarUrl = getAvatarUrl(rating.user.avatarId);
                return (
                    <div key={rating.id} className="bg-background p-4 rounded-lg border border-border transition-colors duration-200 hover:border-primary/30 flex flex-col">
                        <div className="flex space-x-4 flex-grow">
                            <img 
                                src={avatarUrl || PLACEHOLDER_AVATAR} 
                                alt={rating.user.name} 
                                className="w-10 h-10 rounded-full bg-border flex-shrink-0 object-cover"
                                onError={(e) => { e.currentTarget.src = PLACEHOLDER_AVATAR; }}
                            />
                            <div className="flex-grow">
                                <p className="text-sm text-text-secondary">
                                    {rating.user.id ? (
                                        <a href={`https://app.stoutly.co.uk/?user_id=${rating.user.id}`} target="_blank" rel="noopener noreferrer" className="font-semibold text-text-primary hover:text-primary hover:underline transition-colors">{rating.user.name}</a>
                                    ) : (
                                        <span className="font-semibold text-text-primary">{rating.user.name}</span>
                                    )}
                                    {' '}rated{' '}
                                    {rating.pubId ? (
                                        <>
                                            <a href={`https://app.stoutly.co.uk/?pub_id=${rating.pubId}`} target="_blank" rel="noopener noreferrer" className="font-semibold text-primary hover:underline transition-colors">{rating.pubName}</a>
                                            {rating.pubCountryName && <span className="text-xs text-text-secondary ml-2">({rating.pubCountryName}, {rating.pubCountryCode})</span>}
                                        </>
                                    ) : (
                                        <>
                                            <span className="font-semibold text-primary">{rating.pubName}</span>
                                            {rating.pubCountryName && <span className="text-xs text-text-secondary ml-2">({rating.pubCountryName}, {rating.pubCountryCode})</span>}
                                        </>
                                    )}
                                </p>
                                <p className="text-xs text-text-secondary">{rating.timestamp}</p>
                                
                                {rating.message && (
                                    <div className="relative text-sm text-text-primary mt-3 pl-8 py-1">
                                        <div className="absolute top-0 left-0 text-amber-500 opacity-50">
                                            <QuoteIcon />
                                        </div>
                                        <blockquote className="italic">
                                            {rating.message}
                                        </blockquote>
                                    </div>
                                )}

                                {rating.imageUrl && (
                                    <div className="mt-3">
                                        <img src={rating.imageUrl} alt={`pint from ${rating.pubName}`} className="rounded-lg max-h-60 w-auto" />
                                    </div>
                                )}

                                {(rating.quality !== undefined || rating.price !== undefined) && (
                                    <div className="flex items-center justify-end gap-x-6 mt-3 pt-3 border-t border-border">
                                        <RatingDetail score={rating.quality} icon={<BeerIcon />} name="Quality" />
                                        <RatingDetail score={rating.price} icon={getCurrencyIcon(rating.pubCountryCode)} name="Price" />
                                        {rating.exactPrice && <span className="text-xs text-text-secondary">({formatCurrency(rating.exactPrice, rating.pubCountryCode || rating.user.countryCode)})</span>}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
            {hasMore && (
                 <button onClick={onLoadMore} disabled={isLoadingMore} className="w-full mt-4 bg-border text-text-secondary py-2 rounded-lg hover:bg-primary/20 hover:text-primary transition-colors disabled:opacity-50">
                    {isLoadingMore ? 'Loading...' : 'Load More'}
                </button>
            )}
        </div>
    );
};

const CommentsFeed: React.FC<{ comments: Comment[], onLoadMore: () => void, hasMore: boolean, isLoadingMore: boolean, initialLoading: boolean }> = ({ comments, onLoadMore, hasMore, isLoadingMore, initialLoading }) => {
    if (initialLoading) {
        return (
            <div className="bg-surface rounded-xl shadow-lg p-2 sm:p-4 space-y-4 max-w-3xl mx-auto animate-pulse">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="bg-background p-4 rounded-lg border border-border">
                        <div className="flex space-x-4">
                            <div className="w-10 h-10 rounded-full bg-border flex-shrink-0"></div>
                            <div className="flex-grow space-y-2">
                                <div className="h-4 bg-border rounded w-1/4"></div>
                                <div className="h-3 bg-border rounded w-full mt-2"></div>
                                <div className="h-3 bg-border rounded w-5/6"></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }
    
    const showEmptyState = comments.length === 0 && !isLoadingMore;
    
    return (
        <div className="bg-surface rounded-xl shadow-lg p-2 sm:p-4 space-y-4 max-w-3xl mx-auto">
            {showEmptyState && (
                <div className="text-center py-12 text-text-secondary">
                    <MessageSquareIcon />
                    <p className="mt-2 font-semibold">No Comments Yet</p>
                    <p className="text-sm">When users submit comments, they'll appear here.</p>
                </div>
            )}
            {comments.map(comment => {
                const avatarUrl = getAvatarUrl(comment.user.avatarId);
                return (
                    <div key={comment.id} className="bg-background p-4 rounded-lg flex items-start space-x-4 border border-border transition-colors duration-200 hover:border-primary/30">
                        <img 
                            src={avatarUrl || PLACEHOLDER_AVATAR} 
                            alt={comment.user.name} 
                            className="w-10 h-10 rounded-full bg-border mt-1 flex-shrink-0 object-cover" 
                            onError={(e) => { e.currentTarget.src = PLACEHOLDER_AVATAR; }}
                        />
                        <div className="flex-grow">
                            <div className="flex items-baseline space-x-2">
                                {comment.user.id ? (
                                    <a href={`https://app.stoutly.co.uk/?user_id=${comment.user.id}`} target="_blank" rel="noopener noreferrer" className="font-semibold text-text-primary hover:text-primary hover:underline transition-colors">{comment.user.name}</a>
                                ) : (
                                    <span className="font-semibold text-text-primary">{comment.user.name}</span>
                                )}
                                <span className="text-text-secondary text-xs flex-shrink-0">{comment.timestamp}</span>
                            </div>
                            <p className="text-text-primary mt-2">{comment.text}</p>
                        </div>
                    </div>
                );
            })}
            {hasMore && (
                <button onClick={onLoadMore} disabled={isLoadingMore} className="w-full mt-4 bg-border text-text-secondary py-2 rounded-lg hover:bg-primary/20 hover:text-primary transition-colors disabled:opacity-50">
                    {isLoadingMore ? 'Loading...' : 'Load More'}
                </button>
            )}
        </div>
    );
};

const ImageModal: React.FC<{ image: UploadedImage, onClose: () => void }> = ({ image, onClose }) => {
    const handleDownload = async () => {
        try {
            const response = await fetch(image.imageUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `stoutly_image_${image.id}.jpg`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Failed to download image:", error);
        }
    };

    return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div className="bg-surface p-4 rounded-lg max-w-4xl max-h-[90vh] relative shadow-2xl" onClick={e => e.stopPropagation()}>
            <img src={image.imageUrl} alt={`user upload ${image.id}`} className="max-w-full max-h-[75vh] object-contain rounded-lg mx-auto" />
            <div className="mt-3 text-white">
                <p>Posted by{' '}
                    {image.user.id ? (
                        <a href={`https://app.stoutly.co.uk/?user_id=${image.user.id}`} target="_blank" rel="noopener noreferrer" className="font-bold hover:underline">{image.user.name}</a>
                    ) : (
                        <span className="font-bold">{image.user.name}</span>
                    )}
                </p>
                <p className="text-sm text-text-secondary">{image.timestamp}</p>
            </div>
            <div className="absolute top-2 right-2 flex space-x-2">
                <button 
                    onClick={handleDownload}
                    className="text-text-primary bg-surface rounded-full h-9 w-9 flex items-center justify-center border-2 border-border hover:bg-primary hover:text-white transition-colors"
                    aria-label="Download image"
                >
                    <DownloadIcon />
                </button>
                <button 
                    onClick={onClose} 
                    className="text-text-primary bg-surface rounded-full h-9 w-9 flex items-center justify-center text-2xl font-bold border-2 border-border hover:bg-warning-red hover:text-white transition-colors"
                    aria-label="Close image view"
                >
                    &times;
                </button>
            </div>
        </div>
    </div>
    );
};

const ImageGallery: React.FC<{ images: UploadedImage[], page: number, setPage: (page: number) => void, hasMore: boolean, isLoading: boolean, onImageClick: (image: UploadedImage) => void, initialLoading: boolean, totalImages: number, imagesPerPage: number, setImagesPerPage: (value: number) => void }> = ({ images, page, setPage, hasMore, isLoading, onImageClick, initialLoading, totalImages, imagesPerPage, setImagesPerPage }) => {
    const showSkeleton = initialLoading || (isLoading && images.length === 0);

    const showEmptyState = !initialLoading && !isLoading && images.length === 0;

    return (
        <div className="bg-surface rounded-xl shadow-lg p-4">
            {showSkeleton ? (
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
                    {[...Array(9)].map((_, i) => <div key={i} className="aspect-square bg-border rounded-lg"></div>)}
                 </div>
            ) : showEmptyState ? (
                <div className="text-center py-12 text-text-secondary">
                    <CameraIcon />
                    <p className="mt-2 font-semibold">No Images Yet</p>
                    <p className="text-sm">When users upload images, they'll appear here.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {images.map(image => (
                        <div key={image.id} className="group relative aspect-square overflow-hidden rounded-lg" onClick={() => onImageClick(image)}>
                            <img src={image.imageUrl} alt={`user upload ${image.id}`} className="w-full h-full object-cover rounded-lg transform group-hover:scale-110 transition-transform duration-300 cursor-pointer" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none"></div>
                            <div className="absolute bottom-0 left-0 p-3 text-white w-full">
                                {image.user.id ? (
                                    <a href={`https://app.stoutly.co.uk/?user_id=${image.user.id}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="font-semibold text-sm truncate hover:underline">{image.user.name}</a>
                                ) : (
                                    <p className="font-semibold text-sm truncate">{image.user.name}</p>
                                )}
                                <p className="text-xs text-text-secondary">{image.timestamp}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            
            {!showEmptyState && (
                <div className="flex justify-between items-center mt-4 text-sm flex-wrap gap-2">
                <div className="flex items-center space-x-2">
                    <span className="text-text-secondary">Images per page:</span>
                    <select 
                        value={imagesPerPage}
                        onChange={(e) => setImagesPerPage(Number(e.target.value))}
                        className="bg-border text-text-primary rounded-md px-2 py-1 border-none focus:ring-2 focus:ring-primary transition-colors"
                        disabled={isLoading || initialLoading}
                    >
                        <option value={9}>9</option>
                        <option value={18}>18</option>
                        <option value={27}>27</option>
                    </select>
                    <span className="text-text-secondary">| Total Images: {totalImages.toLocaleString()}</span>
                </div>
                <div className="flex items-center space-x-2">
                    <button onClick={() => setPage(page - 1)} disabled={page === 1 || isLoading || initialLoading} className="px-4 py-2 rounded-lg bg-border disabled:opacity-50 hover:bg-primary hover:text-background transition-colors">Previous</button>
                    <span>Page {page} of {Math.ceil(totalImages / imagesPerPage)}</span>
                    <button onClick={() => setPage(page + 1)} disabled={!hasMore || isLoading || initialLoading} className="px-4 py-2 rounded-lg bg-border disabled:opacity-50 hover:bg-primary hover:text-background transition-colors">Next</button>
                </div>
            </div>
            )}
        </div>
    )
};

export default Content;