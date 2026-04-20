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
    </main>
  )
}

export default App
