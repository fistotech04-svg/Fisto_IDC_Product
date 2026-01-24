import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardNavbar from '../components/DashboardNavbar';
import { Search, SlidersHorizontal, Star, Video, BookOpen, ChevronDown } from 'lucide-react';
import HomeBg from '../assets/images/home_bg.png';
import BookSelf from '../assets/images/book_self1.png';

import CreateFlipbookModal from '../components/CreateFlipbookModal';

const categories = [
  { name: 'Most Popular Books', active: true },
  { name: 'Advancers', active: false },
  { name: 'Catalogs', active: false },
  { name: 'Broachers', active: false },
  { name: 'Education', active: false },
  { name: 'Story', active: false },
  { name: 'Motivation', active: false },
  { name: 'Advancers', active: false },
];

const books = [
  { id: 1, title: 'Letting Go of Affirmations', rating: 4.5, pages: 28, color: 'green', image: 'https://placehold.co/150x220/e2e8f0/1e293b?text=Book+1' },
  { id: 2, title: 'Introduction to Krav Maga', rating: 1.5, pages: 28, color: 'red', image: 'https://placehold.co/150x220/e2e8f0/1e293b?text=Book+2' },
  { id: 3, title: 'Think & Grow Rich', rating: 2.8, pages: 28, color: 'yellow', image: 'https://placehold.co/150x220/e2e8f0/1e293b?text=Book+3' },
  { id: 4, title: 'High Performance Habits', rating: 4.5, pages: 28, color: 'green', image: 'https://placehold.co/150x220/e2e8f0/1e293b?text=Book+4' },
  { id: 5, title: 'The 7 Habits of Highly Effective People', rating: 4.5, pages: 28, color: 'green', image: 'https://placehold.co/150x220/e2e8f0/1e293b?text=Book+5' },
  { id: 6, title: 'Rich Dad Poor Dad', rating: 4.5, pages: 28, color: 'green', image: 'https://placehold.co/150x220/e2e8f0/1e293b?text=Book+6' },
    { id: 7, title: 'Letting Go of Affirmations', rating: 4.5, pages: 28, color: 'green', image: 'https://placehold.co/150x220/e2e8f0/1e293b?text=Book+1' },
  { id: 8, title: 'Introduction to Krav Maga', rating: 1.5, pages: 28, color: 'red', image: 'https://placehold.co/150x220/e2e8f0/1e293b?text=Book+2' },
  { id: 9, title: 'Think & Grow Rich', rating: 2.8, pages: 28, color: 'yellow', image: 'https://placehold.co/150x220/e2e8f0/1e293b?text=Book+3' },
  { id: 10, title: 'High Performance Habits', rating: 4.5, pages: 28, color: 'green', image: 'https://placehold.co/150x220/e2e8f0/1e293b?text=Book+4' },
  { id: 11, title: 'The 7 Habits of Highly Effective People', rating: 4.5, pages: 28, color: 'green', image: 'https://placehold.co/150x220/e2e8f0/1e293b?text=Book+5' },
  { id: 12, title: 'Rich Dad Poor Dad', rating: 4.5, pages: 28, color: 'green', image: 'https://placehold.co/150x220/e2e8f0/1e293b?text=Book+6' },
];

export default function Home() {
  const [activeCategory, setActiveCategory] = useState('Most Popular Books');
  const [offsetY, setOffsetY] = useState(0);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const navigate = useNavigate();

  const handleCreateFlipbook = () => {
    setIsCreateModalOpen(true);
  };

  const handleUploadPDF = () => {
    console.log("Upload PDF Clicked");
    // navigate('/upload-pdf'); // Example
    setIsCreateModalOpen(false);
  };

  const handleUseTemplate = (templateData) => {
    console.log("Use Template Clicked");
    setIsCreateModalOpen(false);
    if (templateData) {
        navigate('/editor', { state: templateData });
    }
  };

  // Parallax / Scroll Logic
  useEffect(() => {
    const handleScroll = () => {
      setOffsetY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
 <div className="min-h-screen bg-white font-sans text-gray-900 overflow-x-hidden relative top-[8vh]">
      

      {/* Hero Section */}
      <div className="relative w-full overflow-visible bg-black bg-cover bg-center" >

        {/* Curved Background Shape with Parallax Image */}
        <div 
          className="absolute top-0 left-0 w-full h-[650px] z-10 overflow-hidden"
        >
             {/* The Shape Container (Mask) */}
             <div className="w-[120%] h-[100%] absolute top-0 -left-[10%] rounded-b-[0%] overflow-hidden transform origin-top scale-x-120">
                  {/* The Moving Image */}
                  <img 
                    src={HomeBg} 
                    alt="Hero Background"
                    className="absolute inset-0 w-full h-[140%] object-contain"
                  />
             </div>
        </div>

        <div className="max-w-7xl mx-auto py-16 flex items-center relative z-10">
            {/* Left Content */}
            <div className="w-full md:w-2/3 lg:w-2/3 text-white z-20">
                <h1 className="text-4xl md:text-4xl font-semibold leading-tight mb-4">
                    Create Interactive Flipbooks In Seconds
                </h1>
                <p className="text-base md:text-lg text-gray-300 mb-8 max-w-lg leading-relaxed font-light">
                    Upload any PDF and instantly convert it into a smooth, interactive flipbook. Zoom, search, full screen, and share everything your viewers need in one place.
                </p>
                <div className="flex flex-wrap gap-4">
                    <button 
                        onClick={handleCreateFlipbook}
                        className="px-6 py-3 bg-white text-[#4c5add] rounded-lg font-bold shadow hover:bg-gray-50 transition-all flex items-center gap-2"
                    >
                        <BookOpen size={20} />
                        Create Flipbook
                    </button>
                    <button className="px-6 py-3 bg-[#4c5add] text-white rounded-lg font-bold shadow hover:bg-[#3f4bc0] transition-all flex items-center gap-2">
                        <Video size={20} />
                        Demo video
                    </button>
                </div>
            </div>

            {/* Right Content - Bookshelf */}
            {/* Using absolute positioning to hang off the right side as per design */}
            <div className="hidden lg:block absolute -right-20 top-10 w-[350px] z-20">
                 {/* Pointer Text */}
                 <div className="absolute -top-5 -left-10 text-right animate-pulse">
                     <p className="text-white font-medium mb-1 text-sm">Use Demo Book <br/> For Reference</p>
                     <div className="flex justify-end">
                        <svg width="60" height="30" viewBox="0 0 100 50" fill="none" stroke="white" strokeWidth="1.5" strokeDasharray="4 4">
                            <path d="M10 40 Q 60 10 90 20" />
                            <path d="M85 15 L 90 20 L 80 25" fill="none" strokeDasharray="0"/>
                        </svg>
                     </div>
                 </div>

                 {/* Bookshelf Image Placeholder */}
                 <div className="relative w-full h-[500px] transition-transform duration-200 ease-out">
                     <div className="w-full h-full bg-contain bg-no-repeat bg-top drop-shadow-2xl"
                          style={{ backgroundImage: `url(${BookSelf})` }}
                     >
                        {/* Click to Edit Button on shelf */}
                        <div className="absolute top-[55%] -left-10 bg-transparent text-white font-medium flex items-center gap-2 cursor-pointer">
                             <div className="w-8 h-8 rounded-full border border-white/50 flex items-center justify-center">
                                 <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                             </div>
                             Click to Edit
                        </div>
                     </div>
                 </div>
            </div>
        </div>
      </div>

      {/* Search & Filter Section */}
      <div className="max-w-7xl mx-auto px-8 mt-4 relative z-10">
          <div className="flex flex-col md:flex-row gap-4 mb-8">
                {/* Search Bar */}
                <div className="relative w-full md:w-80 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search..." 
                        className="w-full pl-10 pr-4 py-2.5 rounded-full border border-gray-300 text-sm focus:outline-none focus:border-[#4c5add] transition-all bg-white"
                    />
                </div>
                {/* Filter Button */}
                <button className="flex items-center gap-2 px-6 py-2.5 rounded-full border border-gray-300 text-[#4c5add] text-sm font-semibold bg-white hover:bg-gray-50 transition-all">
                    <SlidersHorizontal size={18} />
                    Filter
                </button>
          </div>

          {/* Categories */}
          <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide mb-8 pb-2">
                <span className="font-bold text-black text-sm whitespace-nowrap mr-2">Categories :</span>
                <button className="px-5 py-2 rounded-full bg-black text-white text-xs font-bold shadow-md whitespace-nowrap">
                    Most Popular Books
                </button>
                {categories.slice(1).map((cat, idx) => (
                    <button 
                        key={idx}
                        className="px-5 py-2 rounded-full bg-white border border-gray-100 text-gray-600 text-xs font-medium hover:bg-gray-50 shadow-sm whitespace-nowrap transition-colors"
                    >
                        {cat.name}
                    </button>
                ))}
          </div>

          {/* Section Title */}
          <h2 className="text-2xl font-bold text-black mb-6">Most Popular Books</h2>
      </div>

      {/* Light Blue Card Container area for Grid */}
      <div className="mx-16 bg-[#373d8a4d] py-12 rounded-[40px] px-8 my-4 min-h-screen relative z-10 overflow-hidden">
         {/* Decorative Background Elements */}
         <div className="absolute top-10 right-32 w-12 h-12 bg-blue-200/40 rounded-full blur-sm"></div>
         <div className="absolute top-20 right-10 w-20 h-20 bg-blue-100/50 rounded-full blur-md"></div>
         <div className="absolute -left-10 bottom-20 w-64 h-64 bg-white/30 rounded-full blur-3xl"></div>

         <div className="max-w-7xl mx-auto relative z-10">
             {/* Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6 mb-8">
                {books.map((book) => (
                    <div key={book.id} className="bg-white rounded-2xl p-3 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer group flex flex-col items-center">
                        {/* Image Container */}
                        <div className="relative w-full aspect-[4/5] mb-3 bg-transparent flex items-end justify-center">
                             {/* Book Cover */}
                             <img 
                                src={book.image} 
                                alt={book.title} 
                                className="w-auto h-[90%] object-contain drop-shadow-md transform group-hover:scale-105 transition-transform duration-300"
                            />
                             
                             {/* Rating Badge - Bottom Left */}
                             <div className={`absolute bottom-0 left-0 px-1.5 py-0.5 rounded-[4px] text-[10px] font-bold text-white flex items-center gap-0.5
                                ${book.color === 'green' ? 'bg-[#22c55e]' : book.color === 'red' ? 'bg-[#ef4444]' : 'bg-[#eab308]'}
                             `}>
                                 {book.rating} <Star size={8} fill="currentColor" />
                             </div>

                             {/* Pages Text - Bottom Right */}
                             <span className="absolute bottom-0 right-0 text-[10px] text-gray-400 font-medium">
                                {book.pages} Pages
                             </span>
                        </div>
                        
                        {/* Title */}
                        <div className="w-full text-center border-t border-gray-100 pt-2 mt-1">
                             <h3 className="text-sm font-medium text-gray-800 line-clamp-1 group-hover:text-[#4c5add] transition-colors" title={book.title}>
                                {book.title || 'Name of the FlipBook'}
                             </h3>
                        </div>
                    </div>
                ))}
            </div>

            {/* View More Button */}
            <div className="flex justify-end mt-4">
                 <button className="flex items-center gap-2 pl-6 pr-2 py-2 bg-[#343868] text-white rounded-full font-bold shadow-lg hover:bg-[#2b2f5a] transition-all group">
                     View More 
                     <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-white/30 transition-colors">
                        <ChevronDown size={18} />
                     </div>
                 </button>
            </div>
         </div>
      </div>

    </div>
     <CreateFlipbookModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onUpload={handleUploadPDF}
        onTemplate={handleUseTemplate}
     />
    </>  
  );
}