import React, { useState, useEffect } from 'react';
import { Book, Film, Target, TrendingUp, Star, Plus, Edit3, Trash2, Calendar, Tag, Search, Filter, Download } from 'lucide-react';
import { getDefaultGrowthPlanData } from '../data/growthPlanDefaults';

const GrowthPlan = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [books, setBooks] = useState([]);
  const [movies, setMovies] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalType, setModalType] = useState('book'); // 'book' or 'movie'
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // 加载数据
  useEffect(() => {
    const savedBooks = localStorage.getItem('growthPlan_books');
    const savedMovies = localStorage.getItem('growthPlan_movies');
    
    if (savedBooks) {
      setBooks(JSON.parse(savedBooks));
    } else {
      // 如果没有保存的数据，加载默认推荐
      const defaultData = getDefaultGrowthPlanData();
      setBooks(defaultData.books);
    }
    
    if (savedMovies) {
      setMovies(JSON.parse(savedMovies));
    } else {
      // 如果没有保存的数据，加载默认推荐
      const defaultData = getDefaultGrowthPlanData();
      setMovies(defaultData.movies);
    }
  }, []);

  // 保存数据
  useEffect(() => {
    localStorage.setItem('growthPlan_books', JSON.stringify(books));
  }, [books]);

  useEffect(() => {
    localStorage.setItem('growthPlan_movies', JSON.stringify(movies));
  }, [movies]);

  // 统计数据
  const stats = {
    books: {
      total: books.length,
      completed: books.filter(b => b.status === 'completed').length,
      reading: books.filter(b => b.status === 'reading').length,
      planned: books.filter(b => b.status === 'planned').length
    },
    movies: {
      total: movies.length,
      completed: movies.filter(m => m.status === 'completed').length,
      planned: movies.filter(m => m.status === 'planned').length
    }
  };

  const completionRate = {
    books: stats.books.total > 0 ? Math.round((stats.books.completed / stats.books.total) * 100) : 0,
    movies: stats.movies.total > 0 ? Math.round((stats.movies.completed / stats.movies.total) * 100) : 0
  };

  // 获取Top 5
  const topBooks = books
    .filter(b => b.status === 'completed' && b.rating)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 5);

  const topMovies = movies
    .filter(m => m.status === 'completed' && m.rating)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 5);

  // 分类统计
  const bookCategories = books.reduce((acc, book) => {
    if (book.category) {
      acc[book.category] = (acc[book.category] || 0) + 1;
    }
    return acc;
  }, {});

  const handleImportDefaults = (type) => {
    const defaultData = getDefaultGrowthPlanData();
    if (type === 'books') {
      const existingTitles = books.map(b => b.title);
      const newBooks = defaultData.books.filter(book => !existingTitles.includes(book.title));
      if (newBooks.length > 0) {
        setBooks(prev => [...prev, ...newBooks]);
      }
    } else {
      const existingTitles = movies.map(m => m.title);
      const newMovies = defaultData.movies.filter(movie => !existingTitles.includes(movie.title));
      if (newMovies.length > 0) {
        setMovies(prev => [...prev, ...newMovies]);
      }
    }
  };

  const handleAddItem = (type) => {
    setModalType(type);
    setEditingItem(null);
    setShowAddModal(true);
  };

  const handleEditItem = (item, type) => {
    setModalType(type);
    setEditingItem(item);
    setShowAddModal(true);
  };

  const handleDeleteItem = (id, type) => {
    if (window.confirm('确定要删除这个项目吗？')) {
      if (type === 'book') {
        setBooks(books.filter(b => b.id !== id));
      } else {
        setMovies(movies.filter(m => m.id !== id));
      }
    }
  };

  const handleSaveItem = (formData) => {
    const newItem = {
      id: editingItem?.id || Date.now(),
      ...formData,
      createdAt: editingItem?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (modalType === 'book') {
      if (editingItem) {
        setBooks(books.map(b => b.id === editingItem.id ? newItem : b));
      } else {
        setBooks([...books, newItem]);
      }
    } else {
      if (editingItem) {
        setMovies(movies.map(m => m.id === editingItem.id ? newItem : m));
      } else {
        setMovies([...movies, newItem]);
      }
    }

    setShowAddModal(false);
    setEditingItem(null);
  };

  // 过滤数据
  const filterItems = (items) => {
    return items.filter(item => {
      const matchesSearch = !searchTerm || 
        item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.author?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.director?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
      
      return matchesSearch && matchesStatus;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white flex items-center justify-center font-bold text-lg">
              G
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">成长计划</h1>
              <p className="text-sm text-gray-500">阅读观影管理 · 知识内化系统</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-xs text-gray-400">今年目标</div>
              <div className="text-sm font-semibold text-purple-600">书籍 50本 · 电影 100部</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b px-6">
        <nav className="flex space-x-8">
          {[
            { id: 'dashboard', name: '总览仪表盘', icon: TrendingUp },
            { id: 'books', name: '阅读计划', icon: Book },
            { id: 'movies', name: '观影计划', icon: Film }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-4 px-2 border-b-2 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'dashboard' && (
          <DashboardView 
            stats={stats} 
            completionRate={completionRate}
            topBooks={topBooks}
            topMovies={topMovies}
            bookCategories={bookCategories}
          />
        )}
        
        {activeTab === 'books' && (
          <BooksView 
            books={filterItems(books)}
            onAdd={() => handleAddItem('book')}
            onEdit={(book) => handleEditItem(book, 'book')}
            onDelete={(id) => handleDeleteItem(id, 'book')}
            onImportDefaults={() => handleImportDefaults('books')}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
          />
        )}
        
        {activeTab === 'movies' && (
          <MoviesView 
            movies={filterItems(movies)}
            onAdd={() => handleAddItem('movie')}
            onEdit={(movie) => handleEditItem(movie, 'movie')}
            onDelete={(id) => handleDeleteItem(id, 'movie')}
            onImportDefaults={() => handleImportDefaults('movies')}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
          />
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <AddEditModal
          type={modalType}
          item={editingItem}
          onSave={handleSaveItem}
          onClose={() => {
            setShowAddModal(false);
            setEditingItem(null);
          }}
        />
      )}
    </div>
  );
};

// Dashboard View Component
const DashboardView = ({ stats, completionRate, topBooks, topMovies, bookCategories }) => (
  <div className="space-y-6">
    {/* Progress Cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Book className="w-5 h-5 text-blue-500" />
            阅读进度
          </h3>
          <div className="text-2xl font-bold text-blue-600">{completionRate.books}%</div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>已完成</span>
            <span className="font-medium">{stats.books.completed}本</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>在读</span>
            <span className="font-medium">{stats.books.reading}本</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>计划中</span>
            <span className="font-medium">{stats.books.planned}本</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${completionRate.books}%` }}
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Film className="w-5 h-5 text-purple-500" />
            观影进度
          </h3>
          <div className="text-2xl font-bold text-purple-600">{completionRate.movies}%</div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>已观看</span>
            <span className="font-medium">{stats.movies.completed}部</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>计划中</span>
            <span className="font-medium">{stats.movies.planned}部</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
            <div 
              className="bg-purple-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${completionRate.movies}%` }}
            />
          </div>
        </div>
      </div>
    </div>

    {/* Top 5 Lists */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-500" />
          年度Top 5书籍
        </h3>
        <div className="space-y-3">
          {topBooks.length > 0 ? topBooks.map((book, index) => (
            <div key={book.id} className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center text-sm font-bold">
                {index + 1}
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900">{book.title}</div>
                <div className="text-sm text-gray-500">{book.author}</div>
              </div>
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${i < book.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                  />
                ))}
              </div>
            </div>
          )) : (
            <div className="text-gray-500 text-center py-4">暂无评分书籍</div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-500" />
          年度Top 5电影
        </h3>
        <div className="space-y-3">
          {topMovies.length > 0 ? topMovies.map((movie, index) => (
            <div key={movie.id} className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center text-sm font-bold">
                {index + 1}
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900">{movie.title}</div>
                <div className="text-sm text-gray-500">{movie.director}</div>
              </div>
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${i < movie.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                  />
                ))}
              </div>
            </div>
          )) : (
            <div className="text-gray-500 text-center py-4">暂无评分电影</div>
          )}
        </div>
      </div>
    </div>

    {/* Category Statistics */}
    <div className="bg-white rounded-lg p-6 shadow-sm border">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Tag className="w-5 h-5 text-green-500" />
        分类统计
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {Object.entries(bookCategories).map(([category, count]) => (
          <div key={category} className="text-center">
            <div className="text-2xl font-bold text-gray-900">{count}</div>
            <div className="text-sm text-gray-500">{category}</div>
          </div>
        ))}
        {Object.keys(bookCategories).length === 0 && (
          <div className="col-span-full text-gray-500 text-center py-4">暂无分类数据</div>
        )}
      </div>
    </div>
  </div>
);

// Books View Component
const BooksView = ({ books, onAdd, onEdit, onDelete, onImportDefaults, searchTerm, setSearchTerm, filterStatus, setFilterStatus }) => (
  <div className="space-y-6">
    {/* Controls */}
    <div className="flex flex-col sm:flex-row gap-4 justify-between">
      <div className="flex gap-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="搜索书籍或作者..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">全部状态</option>
          <option value="planned">计划阅读</option>
          <option value="reading">正在阅读</option>
          <option value="completed">已完成</option>
        </select>
      </div>
      <div className="flex gap-3">
        <button
          onClick={onAdd}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          添加书籍
        </button>
        <button
          onClick={onImportDefaults}
          className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
        >
          <Download className="w-4 h-4" />
          导入推荐书单
        </button>
      </div>
    </div>

    {/* Books Grid */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {books.map(book => (
        <BookCard key={book.id} book={book} onEdit={onEdit} onDelete={onDelete} />
      ))}
      {books.length === 0 && (
        <div className="col-span-full text-center py-12 text-gray-500">
          <Book className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>还没有添加任何书籍</p>
          <button
            onClick={onAdd}
            className="mt-2 text-blue-500 hover:text-blue-600"
          >
            立即添加第一本书
          </button>
        </div>
      )}
    </div>
  </div>
);

// Movies View Component  
const MoviesView = ({ movies, onAdd, onEdit, onDelete, onImportDefaults, searchTerm, setSearchTerm, filterStatus, setFilterStatus }) => (
  <div className="space-y-6">
    {/* Controls */}
    <div className="flex flex-col sm:flex-row gap-4 justify-between">
      <div className="flex gap-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="搜索电影或导演..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        >
          <option value="all">全部状态</option>
          <option value="planned">计划观看</option>
          <option value="completed">已观看</option>
        </select>
      </div>
      <div className="flex gap-3">
        <button
          onClick={onAdd}
          className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          添加电影
        </button>
        <button
          onClick={onImportDefaults}
          className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
        >
          <Download className="w-4 h-4" />
          导入推荐影单
        </button>
      </div>
    </div>

    {/* Movies Grid */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {movies.map(movie => (
        <MovieCard key={movie.id} movie={movie} onEdit={onEdit} onDelete={onDelete} />
      ))}
      {movies.length === 0 && (
        <div className="col-span-full text-center py-12 text-gray-500">
          <Film className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>还没有添加任何电影</p>
          <button
            onClick={onAdd}
            className="mt-2 text-purple-500 hover:text-purple-600"
          >
            立即添加第一部电影
          </button>
        </div>
      )}
    </div>
  </div>
);

// Book Card Component
const BookCard = ({ book, onEdit, onDelete }) => {
  const statusColors = {
    planned: 'bg-gray-100 text-gray-700',
    reading: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700'
  };

  const statusLabels = {
    planned: '计划阅读',
    reading: '正在阅读', 
    completed: '已完成'
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[book.status]}`}>
          {statusLabels[book.status]}
        </span>
        <div className="flex gap-1">
          <button
            onClick={() => onEdit(book)}
            className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(book.id)}
            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <h3 className="font-semibold text-gray-900 mb-1">{book.title}</h3>
      <p className="text-sm text-gray-600 mb-2">{book.author}</p>
      
      {book.category && (
        <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded mb-3">
          {book.category}
        </span>
      )}
      
      {book.rating && (
        <div className="flex items-center gap-1 mb-3">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`w-4 h-4 ${i < book.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
            />
          ))}
        </div>
      )}
      
      {book.summary && (
        <p className="text-sm text-gray-600 line-clamp-3">{book.summary}</p>
      )}
      
      {book.completedDate && (
        <div className="mt-3 text-xs text-gray-500 flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {new Date(book.completedDate).toLocaleDateString()}
        </div>
      )}
    </div>
  );
};

// Movie Card Component
const MovieCard = ({ movie, onEdit, onDelete }) => {
  const statusColors = {
    planned: 'bg-gray-100 text-gray-700',
    completed: 'bg-green-100 text-green-700'
  };

  const statusLabels = {
    planned: '计划观看',
    completed: '已观看'
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[movie.status]}`}>
          {statusLabels[movie.status]}
        </span>
        <div className="flex gap-1">
          <button
            onClick={() => onEdit(movie)}
            className="p-1 text-gray-400 hover:text-purple-500 transition-colors"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(movie.id)}
            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <h3 className="font-semibold text-gray-900 mb-1">{movie.title}</h3>
      <p className="text-sm text-gray-600 mb-2">{movie.director}</p>
      
      {movie.genre && (
        <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded mb-3">
          {movie.genre}
        </span>
      )}
      
      {movie.rating && (
        <div className="flex items-center gap-1 mb-3">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`w-4 h-4 ${i < movie.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
            />
          ))}
        </div>
      )}
      
      {movie.summary && (
        <p className="text-sm text-gray-600 line-clamp-3">{movie.summary}</p>
      )}
      
      {movie.watchedDate && (
        <div className="mt-3 text-xs text-gray-500 flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {new Date(movie.watchedDate).toLocaleDateString()}
        </div>
      )}
    </div>
  );
};

// Add/Edit Modal Component
const AddEditModal = ({ type, item, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    director: '',
    category: '',
    genre: '',
    status: 'planned',
    priority: 'B',
    rating: 0,
    summary: '',
    keyPoints: '',
    thoughts: '',
    connections: '',
    questions: '',
    actions: '',
    completedDate: '',
    watchedDate: '',
    ...item
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    
    onSave(formData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isBook = type === 'book';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {item ? '编辑' : '添加'}{isBook ? '书籍' : '电影'}
          </h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {isBook ? '书名' : '电影名'}*
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {isBook ? '作者' : '导演'}
              </label>
              <input
                type="text"
                value={isBook ? formData.author : formData.director}
                onChange={(e) => handleChange(isBook ? 'author' : 'director', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {isBook ? '分类' : '类型'}
              </label>
              <input
                type="text"
                value={isBook ? formData.category : formData.genre}
                onChange={(e) => handleChange(isBook ? 'category' : 'genre', e.target.value)}
                placeholder={isBook ? '如：哲学、历史' : '如：剧情、科幻'}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
              <select
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="planned">{isBook ? '计划阅读' : '计划观看'}</option>
                {isBook && <option value="reading">正在阅读</option>}
                <option value="completed">{isBook ? '已完成' : '已观看'}</option>
              </select>
            </div>
            
            {isBook && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">优先级</label>
                <select
                  value={formData.priority}
                  onChange={(e) => handleChange('priority', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="A">A - 必读</option>
                  <option value="B">B - 强烈推荐</option>
                  <option value="C">C - 有兴趣</option>
                </select>
              </div>
            )}
          </div>

          {/* Rating */}
          {formData.status === 'completed' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">评分</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(rating => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => handleChange('rating', rating)}
                    className="p-1"
                  >
                    <Star
                      className={`w-6 h-6 ${rating <= formData.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Completion Date */}
          {formData.status === 'completed' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {isBook ? '完成日期' : '观看日期'}
              </label>
              <input
                type="date"
                value={isBook ? formData.completedDate : formData.watchedDate}
                onChange={(e) => handleChange(isBook ? 'completedDate' : 'watchedDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}

          {/* Summary */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {isBook ? '一句话概括' : '一句话影评'}
            </label>
            <textarea
              value={formData.summary}
              onChange={(e) => handleChange('summary', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={isBook ? '用一句话概括这本书的核心思想...' : '用一句话说出这部电影的灵魂...'}
            />
          </div>

          {/* Extended fields for completed items */}
          {formData.status === 'completed' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isBook ? '核心观点' : '核心主题'}
                </label>
                <textarea
                  value={formData.keyPoints}
                  onChange={(e) => handleChange('keyPoints', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={isBook ? '记录作者的逻辑主线和核心论点...' : '这部电影真正想探讨的是什么？'}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">我的思考与启发</label>
                <textarea
                  value={formData.thoughts}
                  onChange={(e) => handleChange('thoughts', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="新认知如何改变了你？给你带来了怎样的启迪？"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">与旧知的连接</label>
                <textarea
                  value={formData.connections}
                  onChange={(e) => handleChange('connections', e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="这个观点与你之前的认知有什么关联？"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">问题与批判</label>
                <textarea
                  value={formData.questions}
                  onChange={(e) => handleChange('questions', e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="有什么疑问或不同观点？培养批判性思维..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">行动与改变</label>
                <textarea
                  value={formData.actions}
                  onChange={(e) => handleChange('actions', e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="知识如何转化为力量？你打算如何应用？"
                />
              </div>
            </>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              保存
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GrowthPlan;