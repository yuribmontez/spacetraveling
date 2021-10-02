import { GetStaticProps } from 'next';
import Head from 'next/head';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import Link from 'next/link';
import { useState } from 'react';
import { FiUser } from 'react-icons/fi';
import { FiCalendar } from 'react-icons/fi';
import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
  preview: boolean;
}

export default function Home({ postsPagination, preview }: HomeProps) {
  const { results, next_page } = postsPagination;

  const postsFormatted = results.map(post => {
    return {
      ...post,
      first_publication_date: format(
        new Date(post.first_publication_date),
        'PP',
        {
          locale: ptBR,
        }
      ),
    };
  });

  const [posts, setPosts] = useState<Post[]>(postsFormatted);
  const [nextPage, setNextPage] = useState(next_page);

  const handleLoadMore = async () => {
    const newPageResults = await fetch(`${nextPage}`).then(response =>
      response.json()
    );
    setNextPage(newPageResults.next_page);

    const newPosts = newPageResults.results.map(post => {
      return {
        uid: post.uid,
        first_publication_date: format(
          new Date(post.first_publication_date),
          'PP',
          {
            locale: ptBR,
          }
        ),
        data: {
          title: post.data.title,
          subtitle: post.data.subtitle,
          author: post.data.author,
        },
      };
    });
    setPosts([...newPosts, ...posts]);
  };

  return (
    <>
      <Head>
        <title>Home | spacetraveling</title>
      </Head>
      <div className={commonStyles.container}>
        <div>
          {posts.map(post => (
            <Link key={post.uid} href={`/post/${post.uid}`}>
              <a className={styles.post}>
                <title>{post.data.title}</title>
                <p className={styles.subtitle}>{post.data.subtitle}</p>
                <div className={styles.info}>
                  <time>
                    <FiCalendar /> {post.first_publication_date}
                  </time>
                  <p>
                    <FiUser /> {post.data.author}
                  </p>
                </div>
              </a>
            </Link>
          ))}
        </div>

        {nextPage !== null && (
          <button
            type="button"
            className={styles.loadMore}
            onClick={handleLoadMore}
          >
            Carregar mais posts
          </button>
        )}
        {preview && (
          <aside className={commonStyles.exitPreview}>
            <Link href="/api/exit-preview">
              <a>Sair do modo Preview</a>
            </Link>
          </aside>
        )}
      </div>
    </>
  );
}

export const getStaticProps: GetStaticProps<HomeProps> = async ({
  preview = false,
  previewData,
}) => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query('', {
    pageSize: 4,
    ref: previewData?.ref ?? null,
  });

  const results = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    };
  });

  return {
    props: {
      postsPagination: {
        results,
        next_page: postsResponse.next_page,
      },
      preview,
    },
    revalidate: 60 * 60 * 24, // 24h
  };
};
