import React, { useState, useEffect } from 'react';
import { getRatingsData, getCommentsData, getImagesData } from '../../services/supabaseService';
import type { Rating, Comment, UploadedImage } from '../../types';
import { StarIcon, MessageSquareIcon, CameraIcon, AtmosphereIcon, BeerIcon, DollarSignIcon } from '../icons/Icons';

type SubTab = 'ratings' | 'comments' | 'images';

const Content: React.FC = () => {
    const [subTab, setSubTab] = useState<SubTab>('ratings');
    const [ratings, setRatings] = useState<Rating[]>([]);
    
    // State for comments with infinite scroll
    const [comments, setComments] = useState<Comment[]>([]);
    const [commentsPage, setCommentsPage] = useState(1);
    const [hasMoreComments, setHasMoreComments] = useState(true);
    const [loadingMoreComments, setLoadingMoreComments] = useState(false);
    
    // State for images with server-side pagination
    const [images, setImages] = useState<UploadedImage[]>([]);
    const [imagesPage, setImagesPage] = useState(1); // 1-based index for API
    const [hasMoreImages, setHasMoreImages] = useState(true);
    const [loadingImages, setLoadingImages] = useState(false);
    
    const [loading, setLoading] = useState(true); // For initial component load
    const [selectedImage, setSelectedImage] = useState<UploadedImage | null>(null);


    const IMAGES_PER_PAGE = 9;
    const COMMENTS_PER_PAGE = 20;

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const [ratingsData, commentsData, imagesData] = await Promise.all([
                getRatingsData(),
                getCommentsData(1, COMMENTS_PER_PAGE),
                getImagesData(1, IMAGES_PER_PAGE)
            ]);
            setRatings(ratingsData);
            setComments(commentsData);
            setImages(imagesData);

            setHasMoreComments(commentsData.length === COMMENTS_PER_PAGE);
            setHasMoreImages(imagesData.length === IMAGES_PER_PAGE);
            setLoading(false);
        };
        fetchData();
    }, []);

    const handleLoadMoreComments = async () => {
        if (loadingMoreComments || !hasMoreComments) return;

        setLoadingMoreComments(true);
        const nextPage = commentsPage + 1;
        try {
            const newComments = await getCommentsData(nextPage, COMMENTS_PER_PAGE);
            setComments(prev => [...prev, ...newComments]);
            setCommentsPage(nextPage);
            if (newComments.length < COMMENTS_PER_PAGE) {
                setHasMoreComments(false);
            }
        } catch (error) {
            console.error("Failed to load more comments", error);
        } finally {
            setLoadingMoreComments(false);
        }
    };
    
    useEffect(() => {
        if (imagesPage === 1) return; 

        const fetchImageData = async () => {
            setLoadingImages(true);
            try {
                const newImages = await getImagesData(imagesPage, IMAGES_PER_PAGE);
                setImages(newImages);
                setHasMoreImages(newImages.length === IMAGES_PER_PAGE);
            } catch (error) {
                console.error(`Failed to fetch images for page ${imagesPage}`, error);
            } finally {
                setLoadingImages(false);
            }
        };
        fetchImageData();
    }, [imagesPage]);
    
     const subTabs: { id: SubTab; label: string, icon: React.ReactNode }[] = [
        { id: 'ratings', label: 'Ratings Feed', icon: <StarIcon /> },
        { id: 'comments', label: 'Comments Feed', icon: <MessageSquareIcon /> },
        { id: 'images', label: 'Image Gallery', icon: <CameraIcon /> },
    ];

    const renderContent = () => {
        if (loading) return <div className="bg-surface rounded-xl h-96 animate-pulse mt-4"></div>;

        switch (subTab) {
            case 'ratings':
                return <RatingsFeed ratings={ratings} />;
            case 'comments':
                return <CommentsFeed comments={comments} onLoadMore={handleLoadMoreComments} hasMore={hasMoreComments} isLoadingMore={loadingMoreComments} />;
            case 'images':
                return <ImageGallery images={images} page={imagesPage - 1} setPage={(p) => setImagesPage(p + 1)} hasMore={hasMoreImages} isLoading={loadingImages} onImageClick={setSelectedImage} />;
            default:
                return null;
        }
    };

    return (
        <section>
            <h2 className="text-2xl font-bold mb-6">Content Feeds</h2>
            
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

const RatingsFeed: React.FC<{ ratings: Rating[] }> = ({ ratings }) => (
    <div className="bg-surface rounded-xl shadow-lg p-4 space-y-4 max-w-2xl mx-auto">
        {ratings.map(rating => (
            <div key={rating.id} className="bg-background p-4 rounded-lg flex space-x-4 border border-border">
                <img 
                    src={rating.user.avatarUrl} 
                    alt={rating.user.name} 
                    className="w-10 h-10 rounded-full bg-border"
                    onError={(e) => { e.currentTarget.src = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM5Q0EzQUYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMTYgMjF2LTJhNCA0IDAgMCAwLTQtNEg2YTQgNCAwIDAgMC00IDR2MiI+PC9wYXRoPjxjaXJjbGUgY3g9IjkiIGN5PSI3IiByPSI0Ij48L2NpcmNsZT48L3N2Zz4=` }}
                />
                <div className="flex-grow">
                    <p className="text-sm"><span className="font-semibold text-text-primary">{rating.user.name}</span> rated <span className="font-semibold text-primary">{rating.pubName}</span></p>
                    <p className="text-xs text-text-secondary">{rating.timestamp}</p>
                    
                    {(rating.atmosphere !== undefined || rating.quality !== undefined || rating.price !== undefined) && (
                        <div className="flex items-center justify-around space-x-4 mt-3 pt-3 border-t border-border">
                            <RatingDetail score={rating.atmosphere} icon={<AtmosphereIcon />} name="Atmosphere" />
                            <RatingDetail score={rating.quality} icon={<BeerIcon />} name="Quality" />
                            <RatingDetail score={rating.price} icon={<DollarSignIcon />} name="Price" />
                        </div>
                    )}
                </div>
                 <div className="flex flex-col items-center justify-center bg-primary/10 rounded-lg p-2 h-fit">
                    <div className="flex items-center text-lg font-bold text-primary">
                        <StarIcon />
                        <span className="ml-1">{rating.score.toFixed(1)}</span>
                    </div>
                    <span className="text-xs text-primary/80">Overall</span>
                </div>
            </div>
        ))}
         <button className="w-full mt-4 bg-border text-text-secondary py-2 rounded-lg hover:bg-border/80">Load More</button>
    </div>
);

const CommentsFeed: React.FC<{ comments: Comment[], onLoadMore: () => void, hasMore: boolean, isLoadingMore: boolean }> = ({ comments, onLoadMore, hasMore, isLoadingMore }) => (
     <div className="bg-surface rounded-xl shadow-lg p-4 space-y-4 max-w-2xl mx-auto">
        {comments.map(comment => (
            <div key={comment.id} className="bg-background p-3 rounded-lg flex items-start space-x-4 border border-border">
                <img src={comment.user.avatarUrl} alt={comment.user.name} className="w-10 h-10 rounded-full" />
                <div className="flex-grow">
                     <p><span className="font-semibold text-text-primary">{comment.user.name}</span> <span className="text-text-secondary text-xs">{comment.timestamp}</span></p>
                    <p className="text-text-primary mt-1">{comment.text}</p>
                </div>
            </div>
        ))}
        {hasMore && (
            <button onClick={onLoadMore} disabled={isLoadingMore} className="w-full mt-4 bg-border text-text-secondary py-2 rounded-lg hover:bg-border/80 disabled:opacity-50">
                {isLoadingMore ? 'Loading...' : 'Load More'}
            </button>
        )}
    </div>
);

const ImageModal: React.FC<{ image: UploadedImage, onClose: () => void }> = ({ image, onClose }) => (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div className="bg-surface p-4 rounded-lg max-w-4xl max-h-[90vh] relative shadow-2xl" onClick={e => e.stopPropagation()}>
            <img src={image.imageUrl} alt={`user upload ${image.id}`} className="max-w-full max-h-[75vh] object-contain rounded-lg mx-auto" />
            <div className="mt-3 text-white">
                <p>Posted by <span className="font-bold">{image.user.name}</span></p>
                <p className="text-sm text-text-secondary">{image.timestamp}</p>
            </div>
            <button 
                onClick={onClose} 
                className="absolute top-[-10px] right-[-10px] text-text-primary bg-surface rounded-full h-8 w-8 flex items-center justify-center text-xl font-bold border-2 border-border hover:bg-warning-red hover:text-white transition-colors"
                aria-label="Close image view"
            >
                &times;
            </button>
        </div>
    </div>
);

const ImageGallery: React.FC<{ images: UploadedImage[], page: number, setPage: (page: number) => void, hasMore: boolean, isLoading: boolean, onImageClick: (image: UploadedImage) => void }> = ({ images, page, setPage, hasMore, isLoading, onImageClick }) => {
    return (
        <div className="bg-surface rounded-xl shadow-lg p-4">
            {isLoading && images.length === 0 ? (
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
                    {[...Array(9)].map((_, i) => <div key={i} className="aspect-square bg-border rounded-lg"></div>)}
                 </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {images.map(image => (
                        <div key={image.id} className="group relative aspect-square overflow-hidden rounded-lg" onClick={() => onImageClick(image)}>
                            <img src={image.imageUrl} alt={`user upload ${image.id}`} className="w-full h-full object-cover rounded-lg transform group-hover:scale-110 transition-transform duration-300 cursor-pointer" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none"></div>
                            <div className="absolute bottom-0 left-0 p-3 text-white w-full">
                                <p className="font-semibold text-sm truncate">{image.user.name}</p>
                                <p className="text-xs text-text-secondary">{image.timestamp}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            <div className="flex justify-between items-center mt-4 text-sm">
                <button onClick={() => setPage(page - 1)} disabled={page === 0 || isLoading} className="px-4 py-2 rounded-lg bg-border disabled:opacity-50 hover:bg-primary hover:text-background transition-colors">Previous</button>
                <span>Page {page + 1}</span>
                <button onClick={() => setPage(page + 1)} disabled={!hasMore || isLoading} className="px-4 py-2 rounded-lg bg-border disabled:opacity-50 hover:bg-primary hover:text-background transition-colors">Next</button>
            </div>
        </div>
    )
};

export default Content;