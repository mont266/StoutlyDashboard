import React, { useState, useEffect } from 'react';
import { getContentAnalyticsData, getPubsLeaderboard, getRatingsData, getCommentsData, getImagesData } from '../../services/supabaseService';
import type { Pub, ContentAnalytics, Rating, Comment, UploadedImage } from '../../types';
import { StarIcon, BuildingIcon, HashIcon, MessageSquareIcon, CameraIcon } from '../icons/Icons';
import StatCard from '../StatCard';

type SubTab = 'overview' | 'ratings' | 'comments' | 'images';

const Content: React.FC = () => {
    const [subTab, setSubTab] = useState<SubTab>('overview');
    const [analytics, setAnalytics] = useState<ContentAnalytics | null>(null);
    const [pubs, setPubs] = useState<Pub[]>([]);
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

    const IMAGES_PER_PAGE = 6;
    const COMMENTS_PER_PAGE = 20;

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const [analyticsData, pubsData, ratingsData, commentsData, imagesData] = await Promise.all([
                getContentAnalyticsData(),
                getPubsLeaderboard(),
                getRatingsData(),
                getCommentsData(1, COMMENTS_PER_PAGE),
                getImagesData(1, IMAGES_PER_PAGE)
            ]);
            setAnalytics(analyticsData);
            setPubs(pubsData);
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
    
    // Effect for handling image page changes after the initial load
    useEffect(() => {
        if (imagesPage === 1) return; // Initial load is handled in the main useEffect

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
        { id: 'overview', label: 'Overview', icon: <BuildingIcon /> },
        { id: 'ratings', label: 'Ratings Feed', icon: <StarIcon /> },
        { id: 'comments', label: 'Comments Feed', icon: <MessageSquareIcon /> },
        { id: 'images', label: 'Image Gallery', icon: <CameraIcon /> },
    ];

    const renderContent = () => {
        if (loading) return <div className="bg-surface rounded-xl h-96 animate-pulse mt-4"></div>;

        switch (subTab) {
            case 'overview':
                return <OverviewTab analytics={analytics} pubs={pubs} loading={loading} />;
            case 'ratings':
                return <RatingsFeed ratings={ratings} />;
            case 'comments':
                return <CommentsFeed comments={comments} onLoadMore={handleLoadMoreComments} hasMore={hasMoreComments} isLoadingMore={loadingMoreComments} />;
            case 'images':
                return <ImageGallery images={images} page={imagesPage - 1} setPage={(p) => setImagesPage(p + 1)} hasMore={hasMoreImages} isLoading={loadingImages} />;
            default:
                return null;
        }
    };


    return (
        <section>
            <h2 className="text-2xl font-bold mb-6">Content Analytics</h2>
            
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
        </section>
    );
};

const OverviewTab: React.FC<{analytics: ContentAnalytics | null, pubs: Pub[], loading: boolean}> = ({ analytics, pubs, loading }) => {
    const topRatedPubs = [...pubs].sort((a, b) => b.averageScore - a.averageScore).slice(0, 10);
    const mostReviewedPubs = [...pubs].sort((a, b) => b.totalRatings - a.totalRatings).slice(0, 10);
    
    return (
        <div className="space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {loading || !analytics ? 
                    [...Array(3)].map((_,i) => <div key={i} className="h-32 bg-surface rounded-xl animate-pulse"></div>) :
                    <>
                        <StatCard title="Total Pubs" value={analytics.totalPubs.toLocaleString()} icon={<BuildingIcon />} />
                        <StatCard title="Average Overall Rating" value={analytics.averageOverallRating.toFixed(2)} icon={<StarIcon />} />
                        <StatCard title="Total Ratings Submitted" value={analytics.totalRatingsSubmitted.toLocaleString()} icon={<HashIcon />} />
                    </>
                }
            </div>
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                 <PubTable title="Top 10 Rated Pubs" data={topRatedPubs} loading={loading} />
                 <PubTable title="Top 10 Most Reviewed Pubs" data={mostReviewedPubs} loading={loading} />
            </div>
        </div>
    );
};

const PubTable: React.FC<{ title: string, data: Pub[], loading: boolean }> = ({ title, data, loading }) => (
    <div className="bg-surface rounded-xl shadow-lg">
        <h3 className="text-lg font-semibold text-text-primary p-4 border-b border-border">{title}</h3>
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-text-secondary">
                <thead className="text-xs text-text-secondary uppercase bg-background">
                    <tr>
                        <th scope="col" className="px-6 py-3">Pub</th>
                        <th scope="col" className="px-6 py-3 text-center">Score</th>
                        <th scope="col" className="px-6 py-3 text-center">Ratings</th>
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                        [...Array(5)].map((_, i) => (
                            <tr key={i} className="animate-pulse border-b border-border">
                                <td className="px-6 py-4"><div className="h-4 bg-border rounded w-3/4"></div></td>
                                <td className="px-6 py-4 text-center"><div className="h-4 bg-border rounded w-1/2 mx-auto"></div></td>
                                <td className="px-6 py-4 text-center"><div className="h-4 bg-border rounded w-1/2 mx-auto"></div></td>
                            </tr>
                        ))
                    ) : (
                        data.map(pub => (
                            <tr key={pub.id} className="border-b border-border hover:bg-border/50">
                                <td className="px-6 py-4 font-medium text-text-primary">
                                    <div className="flex flex-col">
                                        <span>{pub.name}</span>
                                        <span className="text-xs text-text-secondary">{pub.location}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-text-primary text-center font-semibold">
                                    <span className="flex items-center justify-center">
                                        <StarIcon />
                                        <span className="ml-1">{pub.averageScore.toFixed(1)}</span>
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-text-primary text-center">{pub.totalRatings.toLocaleString()}</td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    </div>
);


const RatingsFeed: React.FC<{ ratings: Rating[] }> = ({ ratings }) => (
    <div className="bg-surface rounded-xl shadow-lg p-4 space-y-4 max-w-2xl mx-auto">
        {ratings.map(rating => (
            <div key={rating.id} className="bg-background p-3 rounded-lg flex items-center space-x-4 border border-border">
                <img src={rating.user.avatarUrl} alt={rating.user.name} className="w-10 h-10 rounded-full" />
                <div className="flex-grow">
                    <p><span className="font-semibold text-text-primary">{rating.user.name}</span> rated <span className="font-semibold text-primary">{rating.pubName}</span></p>
                    <p className="text-xs text-text-secondary">{rating.timestamp}</p>
                </div>
                 <div className="flex items-center text-lg font-bold text-primary">
                    <StarIcon />
                    <span className="ml-1">{rating.score}</span>
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


const ImageGallery: React.FC<{ images: UploadedImage[], page: number, setPage: (page: number) => void, hasMore: boolean, isLoading: boolean }> = ({ images, page, setPage, hasMore, isLoading }) => {
    return (
        <div className="bg-surface rounded-xl shadow-lg p-4">
            {isLoading ? (
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
                    {[...Array(6)].map((_, i) => <div key={i} className="h-48 bg-border rounded-lg"></div>)}
                 </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {images.map(image => (
                        <div key={image.id} className="group relative">
                            <img src={image.imageUrl} alt={`user upload ${image.id}`} className="w-full h-48 object-cover rounded-lg" />
                            <div className="absolute bottom-0 left-0 bg-black/50 text-white p-2 w-full rounded-b-lg text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                                <p className="font-semibold">{image.user.name}</p>
                                <p>{image.timestamp}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            <div className="flex justify-between items-center mt-4 text-sm">
                <button onClick={() => setPage(page - 1)} disabled={page === 0 || isLoading} className="px-3 py-1 rounded bg-border disabled:opacity-50">Previous</button>
                <span>Page {page + 1}</span>
                <button onClick={() => setPage(page + 1)} disabled={!hasMore || isLoading} className="px-3 py-1 rounded bg-border disabled:opacity-50">Next</button>
            </div>
        </div>
    )
};


export default Content;