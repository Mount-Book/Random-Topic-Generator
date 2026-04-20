import './App.css'
import { HeroSection } from './features/topics/components/HeroSection'
import { SavedTopicsSection } from './features/topics/components/SavedTopicsSection'
import { TopicGridSection } from './features/topics/components/TopicGridSection'
import { useTopicGenerator } from './features/topics/hooks/useTopicGenerator'

function App() {
  const topicGenerator = useTopicGenerator()

  return (
    <main className="app-shell">
      <HeroSection {...topicGenerator} />
      <TopicGridSection
        copiedId={topicGenerator.copiedId}
        isDebugPage={topicGenerator.isDebugPage}
        onCopy={topicGenerator.handleCopyTopic}
        onSave={topicGenerator.handleSaveTopic}
        topics={topicGenerator.topics}
      />
      <SavedTopicsSection
        copiedId={topicGenerator.copiedId}
        isDebugPage={topicGenerator.isDebugPage}
        onCopy={topicGenerator.handleCopyTopic}
        onRemove={topicGenerator.handleRemoveSavedTopic}
        savedTopics={topicGenerator.savedTopics}
      />
      <footer className="app-footer" aria-label="アプリについて">
        <p>
          このアプリは「VIPPONをやりたい！」コミュニティの有志が開発した非公式ツールです！
          <br />
          VIPPON GRAND PRIXでの利用を想定しています。
        </p>
        <div className="app-footer-links">
          <p>▼遊びたい人はこちら</p>
          <p className="app-footer-note">各リンクをクリックすると外部ページへ移動します。</p>
          <ul>
            <li>
              <a
                href="https://vrchat.com/home/world/wrld_d1fb2521-2a83-49a3-849a-47ed423a7dad/info"
                rel="noreferrer"
                target="_blank"
              >
                VIPPON GRAND PRIX
              </a>
            </li>
            <li>
              <a
                href="https://vrchat.com/home/group/grp_52c6b9a4-f992-4a4a-9998-e06fb13503e5"
                rel="noreferrer"
                target="_blank"
              >
                VIPPONをやりたい！
              </a>
            </li>
          </ul>
        </div>
      </footer>
    </main>
  )
}

export default App
