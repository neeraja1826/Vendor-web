import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw, Star } from "lucide-react";

import { vendorApi } from "../services/api";
import "./ReviewsPage.css";

function getProducts(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.products)) return response.products;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.products)) {
    return response.data.products;
  }
  throw new Error("The products response format was not recognized.");
}

function getReviews(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.reviews)) return response.reviews;
  throw new Error("The reviews response format was not recognized.");
}

function formatDate(value) {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
}

function Rating({ value }) {
  const rating = Number(value);
  const filled = Number.isFinite(rating)
    ? Math.max(0, Math.min(5, Math.round(rating)))
    : 0;

  return (
    <span
      className="vendor-review-rating"
      aria-label={`${Number.isFinite(rating) ? rating : 0} out of 5 stars`}
    >
      <span className="vendor-review-stars" aria-hidden="true">
        {Array.from({ length: 5 }, (_, index) => (
          <Star
            key={index}
            size={15}
            fill={index < filled ? "currentColor" : "none"}
          />
        ))}
      </span>
      <strong>{Number.isFinite(rating) ? rating.toFixed(1) : "—"}</strong>
    </span>
  );
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let active = true;

    async function loadReviews() {
      setLoading(true);
      setError("");

      try {
        const products = getProducts(
          await vendorApi.getProducts()
        ).filter(
          (product) =>
            product?.review_count == null ||
            Number(product.review_count) > 0
        );
        const rows = [];

        for (let offset = 0; offset < products.length; offset += 8) {
          const batch = products.slice(offset, offset + 8);
          const groups = await Promise.all(
            batch.map(async (product) => ({
              product,
              reviews: getReviews(
                await vendorApi.getProductReviews(product.id)
              ),
            }))
          );

          groups.forEach(({ product, reviews: productReviews }) => {
            productReviews.forEach((review) => {
              rows.push({ product, review });
            });
          });
        }

        if (active) setReviews(rows);
      } catch (requestError) {
        if (active) {
          setError(
            requestError.message || "Unable to load product reviews."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    }

    loadReviews();
    return () => {
      active = false;
    };
  }, [reload]);

  const visibleReviews = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return reviews;

    return reviews.filter(({ product, review }) =>
      [
        product.name,
        review.title,
        review.review_text,
        review.rating,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [reviews, search]);

  const averageRating = reviews.length
    ? reviews.reduce(
        (total, { review }) => total + Number(review.rating || 0),
        0
      ) / reviews.length
    : 0;

  const refresh = useCallback(() => {
    setRefreshing(true);
    setReload((current) => current + 1);
  }, []);

  return (
    <main className="vendor-reviews-page">
      <header className="vendor-reviews-header">
        <div>
          <span className="vendor-reviews-eyebrow">CUSTOMER FEEDBACK</span>
          <h1>Reviews &amp; Ratings</h1>
          <p>Read customer feedback on products in your catalogue.</p>
        </div>
        <button
          type="button"
          className="vendor-reviews-refresh"
          onClick={refresh}
          disabled={loading || refreshing}
        >
          <RefreshCw size={16} className={refreshing ? "is-spinning" : ""} />
          {refreshing ? "Refreshing…" : "Refresh"}
        </button>
      </header>

      <section className="vendor-reviews-summary" aria-label="Review summary">
        <div>
          <span>Total reviews</span>
          <strong>{reviews.length.toLocaleString("en-IN")}</strong>
        </div>
        <div>
          <span>Average rating</span>
          <strong>
            <Star size={18} fill="currentColor" />
            {reviews.length ? averageRating.toFixed(1) : "—"}
          </strong>
        </div>
      </section>

      <label className="vendor-reviews-search">
        <span className="sr-only">Search reviews</span>
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search product or review..."
        />
      </label>

      {error && (
        <div className="vendor-reviews-error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={refresh}>Try again</button>
        </div>
      )}

      {loading ? (
        <div className="vendor-reviews-empty">Loading product reviews…</div>
      ) : !error && visibleReviews.length === 0 ? (
        <div className="vendor-reviews-empty">
          {reviews.length
            ? "No reviews match your search."
            : "No customer reviews have been received for your products yet."}
        </div>
      ) : (
        <section className="vendor-reviews-list" aria-label="Product reviews">
          {visibleReviews.map(({ product, review }) => (
            <article
              className="vendor-review-card"
              key={`${product.id}-${review.id}`}
            >
              <div className="vendor-review-card-heading">
                <div>
                  <span className="vendor-review-product">{product.name || "Product"}</span>
                  {review.title && <h2>{review.title}</h2>}
                </div>
                <Rating value={review.rating} />
              </div>
              {review.review_text && (
                <p className="vendor-review-text">{review.review_text}</p>
              )}
              {review.image_url && (
                <a
                  className="vendor-review-image-link"
                  href={review.image_url}
                  target="_blank"
                  rel="noreferrer"
                >
                  <img src={review.image_url} alt="Customer review attachment" />
                </a>
              )}
              <time className="vendor-review-date" dateTime={review.created_at || undefined}>
                {formatDate(review.created_at)}
              </time>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
