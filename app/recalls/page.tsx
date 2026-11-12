import Link from "next/link";

export default function RecallsPage() {
  // Sample recalls data
  const recalls = [
    {
      id: 1,
      title: "XYZ Baby Stroller Recall",
      category: "Children's Products",
      date: "May 15, 2025",
      severity: "High",
      description: "Recall issued due to a potential fall hazard when the stroller frame collapses unexpectedly.",
      image: "https://placehold.co/600x400/FF00FF/FFFFFF?text=Stroller"
    },
    {
      id: 2,
      title: "ABC Smartphone Battery Recall",
      category: "Electronics",
      date: "May 12, 2025",
      severity: "Medium",
      description: "Recall issued due to batteries overheating during charging, posing a fire risk.",
      image: "https://placehold.co/600x400/00FFFF/1A0733?text=Smartphone"
    },
    {
      id: 3,
      title: "123 Cereal Recall",
      category: "Food & Beverages",
      date: "May 10, 2025",
      severity: "High",
      description: "Recall issued due to potential salmonella contamination in certain batches.",
      image: "https://placehold.co/600x400/FFFF00/1A0733?text=Cereal"
    },
    {
      id: 4,
      title: "Premium SUV Airbag Recall",
      category: "Automotive",
      date: "May 8, 2025",
      severity: "High",
      description: "Recall issued due to airbags that may not deploy properly during a collision.",
      image: "https://placehold.co/600x400/FF00FF/FFFFFF?text=SUV"
    },
    {
      id: 5,
      title: "Designer Coffee Table Recall",
      category: "Household",
      date: "May 5, 2025",
      severity: "Medium",
      description: "Recall issued due to glass tabletops that may shatter unexpectedly.",
      image: "https://placehold.co/600x400/00FFFF/1A0733?text=Table"
    },
    {
      id: 6,
      title: "Natural Face Cream Recall",
      category: "Health & Beauty",
      date: "May 3, 2025",
      severity: "Medium",
      description: "Recall issued due to undeclared allergens that may cause severe reactions.",
      image: "https://placehold.co/600x400/FFFF00/1A0733?text=Cream"
    },
  ];

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-5xl mx-auto">
        {/* Header with Memphis-inspired design */}
        <div className="mb-12 text-center relative">
          {/* Memphis-style decorative elements */}
          <div className="absolute -top-10 right-0 w-20 h-20 rounded-full bg-magenta opacity-20"></div>
          <div className="absolute -bottom-10 left-0 w-32 h-32 rounded-full bg-cyan opacity-20"></div>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-navy">
            Product <span className="text-cyan">Recalls</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Stay informed about the latest product recalls to keep your household safe
          </p>
        </div>

        {/* Filter Section */}
        <div className="mb-8 p-6 bg-white rounded-card shadow-md border-2 border-yellow">
          <h2 className="text-xl font-bold mb-4 text-navy">Filter Recalls</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select className="w-full p-2 border border-gray-300 rounded-md">
                <option value="">All Categories</option>
                <option value="food">Food & Beverages</option>
                <option value="children">Children's Products</option>
                <option value="electronics">Electronics</option>
                <option value="automotive">Automotive</option>
                <option value="household">Household</option>
                <option value="health">Health & Beauty</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
              <select className="w-full p-2 border border-gray-300 rounded-md">
                <option value="">All Severities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
              <select className="w-full p-2 border border-gray-300 rounded-md">
                <option value="">All Time</option>
                <option value="week">Past Week</option>
                <option value="month">Past Month</option>
                <option value="year">Past Year</option>
              </select>
            </div>
          </div>
          <div className="mt-4 text-center">
            <button className="btn-primary">Apply Filters</button>
          </div>
        </div>

        {/* Recalls List */}
        <div className="grid grid-cols-1 gap-8">
          {recalls.map((recall) => (
            <div key={recall.id} className="bg-white rounded-card shadow-md overflow-hidden border-l-4 border-l-magenta">
              <div className="md:flex">
                <div className="md:w-1/3">
                  <img 
                    src={recall.image} 
                    alt={recall.title} 
                    className="h-48 w-full object-cover md:h-full"
                  />
                </div>
                <div className="p-6 md:w-2/3">
                  <div className="flex justify-between items-start mb-4">
                    <h2 className="text-xl font-bold text-navy">{recall.title}</h2>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      recall.severity === 'High' 
                        ? 'bg-red-500 text-white' 
                        : recall.severity === 'Medium'
                          ? 'bg-yellow-500 text-navy'
                          : 'bg-green-500 text-white'
                    }`}>
                      {recall.severity}
                    </span>
                  </div>
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-1">Category: {recall.category}</p>
                    <p className="text-sm text-gray-600">Date: {recall.date}</p>
                  </div>
                  <p className="text-gray-700 mb-4">{recall.description}</p>
                  <Link href={`/recalls/${recall.id}`} className="btn-secondary inline-block">
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="mt-12 flex justify-center">
          <div className="flex space-x-2">
            <button className="px-4 py-2 border border-gray-300 rounded-md bg-white">Previous</button>
            <button className="px-4 py-2 bg-magenta text-white rounded-md">1</button>
            <button className="px-4 py-2 border border-gray-300 rounded-md bg-white">2</button>
            <button className="px-4 py-2 border border-gray-300 rounded-md bg-white">3</button>
            <button className="px-4 py-2 border border-gray-300 rounded-md bg-white">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
