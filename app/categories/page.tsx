import Link from "next/link";

export default function CategoriesPage() {
  // Sample categories
  const categories = [
    { id: 1, name: "Food & Beverages", icon: "🍔", href: "/categories/food", description: "Food, drinks, and consumable products" },
    { id: 2, name: "Children's Products", icon: "🧸", href: "/categories/children", description: "Toys, clothing, and items for children" },
    { id: 3, name: "Electronics", icon: "📱", href: "/categories/electronics", description: "Phones, computers, and electronic devices" },
    { id: 4, name: "Automotive", icon: "🚗", href: "/categories/automotive", description: "Cars, parts, and automotive accessories" },
    { id: 5, name: "Household", icon: "🏠", href: "/categories/household", description: "Furniture, appliances, and home goods" },
    { id: 6, name: "Health & Beauty", icon: "💄", href: "/categories/health", description: "Personal care, cosmetics, and medications" },
    { id: 7, name: "Sports & Outdoors", icon: "⚽", href: "/categories/sports", description: "Sporting goods and outdoor equipment" },
    { id: 8, name: "Pet Products", icon: "🐾", href: "/categories/pets", description: "Food, toys, and supplies for pets" },
    { id: 9, name: "Clothing", icon: "👕", href: "/categories/clothing", description: "Apparel and fashion accessories" },
  ];

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-5xl mx-auto">
        {/* Header with Memphis-inspired design */}
        <div className="mb-12 text-center relative">
          {/* Memphis-style decorative elements */}
          <div className="absolute -top-10 right-0 w-20 h-20 rounded-full bg-cyan opacity-20"></div>
          <div className="absolute -bottom-10 left-0 w-32 h-32 rounded-full bg-yellow opacity-20"></div>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-navy">
            Product <span className="text-magenta">Categories</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Browse product recalls by category to find information relevant to your household
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {categories.map((category) => (
            <Link 
              key={category.id}
              href={category.href}
              className="block transition-transform hover:scale-105"
            >
              <div className="card h-full">
                <div className="flex items-center mb-4">
                  <div className="text-4xl mr-4">{category.icon}</div>
                  <h2 className="text-xl font-bold text-navy">{category.name}</h2>
                </div>
                <p className="text-gray-600 mb-4">{category.description}</p>
                <div className="text-magenta font-bold">View Recalls →</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
