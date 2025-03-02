import { Home, File, Newspaper, ChevronRight } from "lucide-react";

const ImprovedErrorPage = () => {
  return (
    <div className="flex  items-center h-full justify-center flex-row ">
      <div className="flex flex-row md:flex-col justify-self-start  max-w-xl gap-4">
        <p
          className="justify-left font-semibold text-gray-400"
          aria-label="Error code"
        >
          404
        </p>
        <h1 id="error-title" className="text-5xl font-bold">
          Page not found
        </h1>
        <p className="text-muted-foreground text-lg">
          Sorry, we couldn't find the page you're looking for. Here are some
          helpful links instead:
        </p>
      </div>

      <div className="bg-stone-50 rounded-xl p-3 mt-4 flex flex-col gap-3 max-w-xl justify-self-end">
        {/* Home Link */}
        <a
          href="/"
          className="group flex items-center gap-3 p-3 rounded-md hover:bg-stone-200 transition-colors"
        >
          <div className="flex items-center justify-center border rounded-md bg-white h-10 w-10">
            <Home className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-medium underline">Go back to homepage</span>
            <span className="text-muted-foreground text-sm">
              Return to our main page to start fresh
            </span>
          </div>
          <ChevronRight className="h-5 w-5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
        </a>

        {/* Documentation Link */}
        <a
          href="/docs"
          className="group flex items-center gap-3 p-3 rounded-md hover:bg-stone-200 transition-colors"
        >
          <div className="flex items-center justify-center border rounded-md bg-white h-10 w-10">
            <File className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-medium underline">
              Read our documentation
            </span>
            <span className="text-muted-foreground text-sm">
              Learn more about our features and capabilities
            </span>
          </div>
          <ChevronRight className="h-5 w-5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
        </a>

        {/* Blog Link */}
        <a
          href="/blog"
          className="group flex items-center gap-3 p-3 rounded-md hover:bg-stone-200 transition-colors"
        >
          <div className="flex items-center justify-center border rounded-md bg-white h-10 w-10">
            <Newspaper className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-medium underline">Explore our blog</span>
            <span className="text-muted-foreground text-sm">
              Check out our latest articles and updates
            </span>
          </div>
          <ChevronRight className="h-5 w-5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
        </a>
      </div>
    </div>
  );
};

export default ImprovedErrorPage;
