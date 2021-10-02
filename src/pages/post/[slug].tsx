/* eslint-disable no-param-reassign */
/* eslint-disable no-return-assign */
import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import Prismic from '@prismicio/client';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';
import { RichText } from 'prismic-dom';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { getPrismicClient } from '../../services/prismic';
import commonStyles from '../../styles/common.module.scss';
import Comments from '../../components/Comments';
import styles from './post.module.scss';

interface Post {
  uid: string;
  first_publication_date: string | null;
  last_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
  prevPost: Post | null;
  nextPost: Post | null;
  preview: boolean;
}

export default function Post({ post, prevPost, nextPost, preview }: PostProps) {
  const totalWords = post.data.content.reduce((total, contentItem) => {
    total += contentItem.heading.split(' ').length; // all 'heading' words

    const words = contentItem.body.map(item => item.text.split(' ').length); // all 'body' words
    words.map(word => (total += word));

    return total;
  }, 0);

  const readTime = Math.ceil(totalWords / 200);

  const formatedDate = format(new Date(post.first_publication_date), 'PP', {
    locale: ptBR,
  });

  const isPostEdited =
    post.last_publication_date !== post.first_publication_date;

  const router = useRouter();

  if (router.isFallback) {
    return <h1>Carregando...</h1>;
  }

  return (
    <>
      <Head>
        <title>{post.data.title} | spacetraveling</title>
      </Head>
      <img
        className={styles.postBanner}
        src={post.data.banner.url}
        alt="post banner"
      />
      <main className={commonStyles.container}>
        <div className={styles.postData}>
          <h1>{post.data.title}</h1>
          <ul>
            <li>
              <FiCalendar />
              {formatedDate}
            </li>
            <li>
              <FiUser />
              {post.data.author}
            </li>
            <li>
              <FiClock />
              {readTime} min
            </li>
          </ul>
          {isPostEdited && (
            <div className={styles.isEdited}>
              <span>* editado em </span>
              <time>
                {format(new Date(post.last_publication_date), 'dd MMM yyyy', {
                  locale: ptBR,
                })}
              </time>
              , às{' '}
              <time>
                {format(
                  new Date(post.last_publication_date),
                  `${'HH'}:${'mm'}`,
                  { locale: ptBR }
                )}
              </time>
            </div>
          )}
        </div>

        {post.data.content.map(content => (
          <article key={content.heading} className={styles.postContent}>
            <>
              <h2>{content.heading}</h2>
              <p
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={{
                  __html: RichText.asHtml(content.body),
                }}
              />
            </>
          </article>
        ))}
      </main>
      <footer className={styles.postFooter}>
        <div className={styles.footerButtons}>
          {prevPost && (
            <div>
              <Link href={`/post/${prevPost.uid}`}>
                <a>
                  <h6>{prevPost.data.title}</h6>
                  <p>Post anterior</p>
                </a>
              </Link>
            </div>
          )}
          {nextPost && (
            <div>
              <Link href={`/post/${nextPost.uid}`}>
                <a>
                  <h6>{nextPost.data.title}</h6>
                  <p className={styles.nextPost}>Post anterior</p>
                </a>
              </Link>
            </div>
          )}
        </div>
        <Comments />
        {preview && (
          <aside className={commonStyles.exitPreview}>
            <Link href="/api/exit-preview">
              <a>Sair do modo Preview</a>
            </Link>
          </aside>
        )}
      </footer>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    Prismic.predicates.at('document.type', 'posts'),
    {}
  );

  const paths = posts.results.map(post => {
    return {
      params: {
        slug: post.uid,
      },
    };
  });

  return {
    paths,
    fallback: 'blocking',
  };
};

export const getStaticProps: GetStaticProps = async ({
  params,
  preview = false,
  previewData,
}) => {
  const { slug } = params;
  const prismic = getPrismicClient();

  const response = await prismic.getByUID('posts', String(slug), {
    ref: previewData?.ref ?? null,
  });

  const nextPost = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      pageSize: 1,
      orderings: '[document.first_publication_date]',
      after: response.id,
    }
  );

  const prevPost = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      pageSize: 1,
      orderings: '[document.first_publication_date desc]',
      after: response.id,
    }
  );

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    last_publication_date: response.last_publication_date,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      author: response.data.author,
      banner: {
        url: response.data.banner.url,
      },
      content: response.data.content.map(content => {
        return {
          body: [...content.body],
          heading: content.heading,
        };
      }),
    },
  };

  return {
    props: {
      preview,
      post,
      prevPost: prevPost.results[0] ?? null,
      nextPost: nextPost.results[0] ?? null,
    },
  };
};
