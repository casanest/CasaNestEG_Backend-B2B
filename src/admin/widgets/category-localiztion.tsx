
import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Button, Input, Textarea, Select, toast } from "@medusajs/ui"
import { Plus, Trash, Globe, Save, AlertCircle, FolderOpen } from "lucide-react"
import { useState, useCallback, useEffect } from "react"
import { 
  DetailWidgetProps, 
  AdminProductCategory,
} from "@medusajs/framework/types"

// Common language options for localization
const COMMON_LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'it', label: 'Italian' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'ar', label: 'Arabic' },
  { value: 'zh', label: 'Chinese' },
  { value: 'ja', label: 'Japanese' },
  { value: 'ko', label: 'Korean' },
  { value: 'ru', label: 'Russian' },
  { value: 'hi', label: 'Hindi' },
  { value: 'tr', label: 'Turkish' },
  { value: 'nl', label: 'Dutch' },
  { value: 'sv', label: 'Swedish' },
  { value: 'da', label: 'Danish' },
  { value: 'no', label: 'Norwegian' },
  { value: 'fi', label: 'Finnish' },
  { value: 'pl', label: 'Polish' },
  { value: 'cs', label: 'Czech' },
  { value: 'hu', label: 'Hungarian' },
  { value: 'ro', label: 'Romanian' },
  { value: 'bg', label: 'Bulgarian' },
  { value: 'hr', label: 'Croatian' },
  { value: 'sk', label: 'Slovak' },
  { value: 'sl', label: 'Slovenian' },
  { value: 'et', label: 'Estonian' },
  { value: 'lv', label: 'Latvian' },
  { value: 'lt', label: 'Lithuanian' },
  { value: 'mt', label: 'Maltese' },
  { value: 'ga', label: 'Irish' },
  { value: 'cy', label: 'Welsh' },
]

// Types for category localization data
interface CategoryLocalizationData {
  name: string
  description: string
  handle?: string
  meta_title?: string
  meta_description?: string
  seo_keywords?: string
}

interface CategoryLocalizationMap {
  [languageCode: string]: CategoryLocalizationData
}

interface CategoryUpdateResponse {
  product_category: AdminProductCategory
}

// The widget component
const CategoryLocalizationWidget = ({ 
  data,
}: DetailWidgetProps<AdminProductCategory>) => {
  const [isUpdating, setIsUpdating] = useState(false)
  const [localizations, setLocalizations] = useState<CategoryLocalizationMap>({})
  const [selectedLanguage, setSelectedLanguage] = useState<string>('')
  const [hasChanges, setHasChanges] = useState(false)

  // Get initial localization data from metadata
  const getInitialLocalizations = useCallback((): CategoryLocalizationMap => {
    if (!data.metadata) return {}
    
    const metadata = data.metadata as Record<string, any>
    const localizationData = metadata.localizations
    
    if (typeof localizationData === 'object' && localizationData !== null) {
      console.log('Found existing category localization data:', localizationData)
      return localizationData
    }
    
    return {}
  }, [data.metadata])

  // Initialize localizations from metadata
  useEffect(() => {
    const initialLocalizations = getInitialLocalizations()
    setLocalizations(initialLocalizations)
    setHasChanges(false)
  }, [getInitialLocalizations])

  // Update category using admin API
  const updateCategoryMetadata = useCallback(async (categoryId: string, metadata: Record<string, any>) => {
    try {
      console.log('Updating category metadata:', { categoryId, metadata })
      
      const response = await fetch(`/admin/product-categories/${categoryId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ metadata }),
        credentials: 'include',
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Update failed response:', errorText)
        throw new Error(`Update failed: ${response.status} ${response.statusText}`)
      }

      const result: CategoryUpdateResponse = await response.json()
      console.log('Category updated successfully:', result.product_category)
      
      // Update the local data reference to reflect the new metadata
      if (result.product_category) {
        Object.assign(data, result.product_category)
      }
      
      return result.product_category
    } catch (error) {
      console.error('Update error:', error)
      throw error
    }
  }, [data])

  // Show error notification
  const showError = useCallback((message: string) => {
    toast.error("Error", {
      description: message,
      duration: 5000,
    })
  }, [])

  // Show success notification
  const showSuccess = useCallback((message: string) => {
    toast.success("Success", {
      description: message,
      duration: 3000,
    })
  }, [])

  // Add new language
  const handleAddLanguage = () => {
    if (!selectedLanguage) {
      showError('Please select a language')
      return
    }

    if (localizations[selectedLanguage]) {
      showError('This language already exists')
      return
    }

    const newLocalizations = {
      ...localizations,
      [selectedLanguage]: {
        name: '',
        description: '',
        handle: '',
        meta_title: '',
        meta_description: '',
        seo_keywords: '',
      }
    }

    setLocalizations(newLocalizations)
    setSelectedLanguage('')
    setHasChanges(true)
  }

  // Remove language
  const handleRemoveLanguage = (languageCode: string) => {
    if (!window.confirm(`Are you sure you want to remove the ${getLanguageLabel(languageCode)} translation?`)) {
      return
    }

    const newLocalizations = { ...localizations }
    delete newLocalizations[languageCode]
    
    setLocalizations(newLocalizations)
    setHasChanges(true)
  }

  // Update localization data
  const handleLocalizationChange = (
    languageCode: string, 
    field: keyof CategoryLocalizationData, 
    value: string
  ) => {
    const newLocalizations = {
      ...localizations,
      [languageCode]: {
        ...localizations[languageCode],
        [field]: value,
      }
    }

    setLocalizations(newLocalizations)
    setHasChanges(true)
  }

  // Save localizations
  const handleSaveLocalizations = async () => {
    setIsUpdating(true)

    try {
      // Validate that all localizations have at least a name
      const invalidLocalizations = Object.entries(localizations).filter(
        ([_, localization]) => !localization.name.trim()
      )

      if (invalidLocalizations.length > 0) {
        const invalidLanguages = invalidLocalizations.map(([code]) => getLanguageLabel(code)).join(', ')
        showError(`Please provide names for: ${invalidLanguages}`)
        return
      }

      // Update category metadata with localizations
      const updatedMetadata = {
        ...(data.metadata || {}),
        localizations: localizations,
        localization_updated_at: new Date().toISOString(),
        available_languages: Object.keys(localizations),
      }
      
      console.log('Saving category localizations:', updatedMetadata)
      await updateCategoryMetadata(data.id, updatedMetadata)

      setHasChanges(false)
      showSuccess('Category localizations saved successfully')
      
    } catch (error) {
      console.error('Save error:', error)
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to save localizations. Please try again.'
      showError(errorMessage)
    } finally {
      setIsUpdating(false)
    }
  }

  // Get language label from code
  const getLanguageLabel = (code: string): string => {
    const language = COMMON_LANGUAGES.find(lang => lang.value === code)
    return language ? language.label : code.toUpperCase()
  }

  // Get available languages for selection (excluding already added ones)
  const getAvailableLanguages = () => {
    return COMMON_LANGUAGES.filter(lang => !localizations[lang.value])
  }

  // Check if there are any localizations
  const hasLocalizations = Object.keys(localizations).length > 0

  // Get category display info
  const getCategoryDisplayInfo = () => {
    return {
      name: data.name || 'Untitled Category',
      handle: data.handle || 'no-handle',
      description: data.description || 'No description',
      isActive: data.is_active,
      isInternal: data.is_internal,
      rank: data.rank || 0,
      hasParent: !!data.parent_category_id,
      hasChildren: (data.category_children || []).length > 0
    }
  }

  const categoryInfo = getCategoryDisplayInfo()

  return (
    <Container className="divide-y p-0">
      {/* Header */}
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FolderOpen className="w-5 h-5 text-ui-fg-subtle" />
            <Heading level="h2">Category Localization</Heading>
            {hasLocalizations && (
              <span className="text-sm text-ui-fg-subtle">
                ({Object.keys(localizations).length} language{Object.keys(localizations).length !== 1 ? 's' : ''})
              </span>
            )}
          </div>
          {hasChanges && (
            <Button
              variant="primary"
              size="small"
              onClick={handleSaveLocalizations}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-1" />
                  Save Changes
                </>
              )}
            </Button>
          )}
        </div>
        
        {/* Category Info */}
        <div className="mt-3 p-3 bg-ui-bg-subtle rounded-md">
          <div className="text-sm">
            <div className="font-medium text-ui-fg-base flex items-center gap-2">
              {categoryInfo.name}
              <div className="flex gap-1">
                {categoryInfo.isActive && (
                  <span className="px-2 py-1 bg-ui-tag-green-bg text-ui-tag-green-text rounded text-xs">Active</span>
                )}
                {categoryInfo.isInternal && (
                  <span className="px-2 py-1 bg-ui-tag-blue-bg text-ui-tag-blue-text rounded text-xs">Internal</span>
                )}
              </div>
            </div>
            <div className="text-ui-fg-subtle">Handle: {categoryInfo.handle}</div>
            <div className="text-ui-fg-subtle">Rank: {categoryInfo.rank}</div>
            {categoryInfo.hasParent && (
              <div className="text-ui-fg-subtle">Has parent category</div>
            )}
            {categoryInfo.hasChildren && (
              <div className="text-ui-fg-subtle">Has child categories</div>
            )}
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="px-6 py-4">
        {/* Add language section */}
        <div className="mb-6">
          <div className="flex items-center space-x-2 mb-4">
            <div className="flex-1">
              <Select
                value={selectedLanguage}
                onValueChange={setSelectedLanguage}
                disabled={isUpdating}
              >
                <Select.Trigger>
                  <Select.Value placeholder="Select a language to add..." />
                </Select.Trigger>
                <Select.Content>
                  {getAvailableLanguages().map((language) => (
                    <Select.Item key={language.value} value={language.value}>
                      {language.label}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select>
            </div>
            <Button
              variant="secondary"
              onClick={handleAddLanguage}
              disabled={!selectedLanguage || isUpdating}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Language
            </Button>
          </div>
        </div>

        {/* Localizations list */}
        {hasLocalizations ? (
          <div className="space-y-6">
            {Object.entries(localizations).map(([languageCode, localization]) => (
              <div key={languageCode} className="border border-ui-border-base rounded-lg p-4 bg-ui-bg-base">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-ui-bg-base rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-ui-fg-base">
                        {languageCode.toUpperCase()}
                      </span>
                    </div>
                    <h3 className="font-medium text-ui-fg-base">
                      {getLanguageLabel(languageCode)}
                    </h3>
                  </div>
                  <Button
                    variant="secondary"
                    size="small"
                    onClick={() => handleRemoveLanguage(languageCode)}
                    disabled={isUpdating}
                    className="text-ui-tag-red-text"
                  >
                    <Trash className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-4">
                  {/* Name input */}
                  <div>
                    <label className="block text-sm font-medium text-ui-fg-base mb-1">
                      Category Name *
                    </label>
                    <Input
                      value={localization.name}
                      onChange={(e) => handleLocalizationChange(languageCode, 'name', e.target.value)}
                      placeholder={`Enter category name in ${getLanguageLabel(languageCode)}`}
                      disabled={isUpdating}
                      className="w-full"
                    />
                  </div>

                  {/* Description input */}
                  <div>
                    <label className="block text-sm font-medium text-ui-fg-base mb-1">
                      Description
                    </label>
                    <Textarea
                      value={localization.description}
                      onChange={(e) => handleLocalizationChange(languageCode, 'description', e.target.value)}
                      placeholder={`Enter category description in ${getLanguageLabel(languageCode)}`}
                      disabled={isUpdating}
                      className="w-full"
                      rows={3}
                    />
                  </div>

                  {/* Handle input */}
                  <div>
                    <label className="block text-sm font-medium text-ui-fg-base mb-1">
                      Handle (URL slug)
                    </label>
                    <Input
                      value={localization.handle || ''}
                      onChange={(e) => handleLocalizationChange(languageCode, 'handle', e.target.value)}
                      placeholder={`Enter URL handle in ${getLanguageLabel(languageCode)}`}
                      disabled={isUpdating}
                      className="w-full"
                    />
                  </div>

                  {/* SEO Fields */}
                  <div className="border-t border-ui-border-base pt-4">
                    <h4 className="font-medium text-ui-fg-base mb-3">SEO Settings</h4>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-ui-fg-base mb-1">
                          Meta Title
                        </label>
                        <Input
                          value={localization.meta_title || ''}
                          onChange={(e) => handleLocalizationChange(languageCode, 'meta_title', e.target.value)}
                          placeholder={`Meta title in ${getLanguageLabel(languageCode)}`}
                          disabled={isUpdating}
                          className="w-full"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-ui-fg-base mb-1">
                          Meta Description
                        </label>
                        <Textarea
                          value={localization.meta_description || ''}
                          onChange={(e) => handleLocalizationChange(languageCode, 'meta_description', e.target.value)}
                          placeholder={`Meta description in ${getLanguageLabel(languageCode)}`}
                          disabled={isUpdating}
                          className="w-full"
                          rows={2}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-ui-fg-base mb-1">
                          SEO Keywords
                        </label>
                        <Input
                          value={localization.seo_keywords || ''}
                          onChange={(e) => handleLocalizationChange(languageCode, 'seo_keywords', e.target.value)}
                          placeholder={`Keywords separated by commas in ${getLanguageLabel(languageCode)}`}
                          disabled={isUpdating}
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Globe className="w-12 h-12 text-ui-fg-muted mx-auto mb-4" />
            <h3 className="text-lg font-medium text-ui-fg-base mb-2">
              No Localizations Added
            </h3>
            <p className="text-ui-fg-subtle mb-4">
              Add translations for your category name, description, and SEO content in different languages.
            </p>
            <p className="text-sm text-ui-fg-muted">
              Select a language from the dropdown above to get started.
            </p>
          </div>
        )}

        {/* Save button at bottom */}
        {hasLocalizations && hasChanges && (
          <div className="mt-6 pt-4 border-t border-ui-border-base">
            <Button
              variant="primary"
              onClick={handleSaveLocalizations}
              disabled={isUpdating}
              className="w-full"
            >
              {isUpdating ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  Saving Localizations...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save All Localizations
                </>
              )}
            </Button>
          </div>
        )}

        {/* Metadata storage info */}
        {hasLocalizations && (
          <div className="mt-6 p-3 bg-ui-bg-subtle rounded-md">
            <div className="flex items-start">
              <AlertCircle className="w-4 h-4 text-ui-fg-subtle mt-0.5 mr-2 flex-shrink-0" />
              <div className="text-xs text-ui-fg-base">
                <p className="font-medium mb-1">Metadata Storage</p>
                <ul className="space-y-1 text-ui-fg-subtle">
                  <li>• <code>localizations</code> - Object containing all translations</li>
                  <li>• <code>available_languages</code> - Array of language codes</li>
                  <li>• <code>localization_updated_at</code> - Last update timestamp</li>
                </ul>
                <p className="mt-2 text-ui-fg-subtle">
                  Each language contains: <code>name</code>, <code>description</code>, <code>handle</code>, <code>meta_title</code>, <code>meta_description</code>, and <code>seo_keywords</code> fields
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Current metadata display */}
        {hasLocalizations && (
          <div className="mt-4 p-3 bg-ui-bg-subtle rounded-md">
            <div>
              <label className="block text-xs font-medium text-ui-fg-base mb-1">
                Current Localization Data
              </label>
              <pre className="text-xs text-ui-fg-subtle overflow-x-auto p-2 bg-ui-bg-base rounded border border-ui-border-base max-h-32">
                {JSON.stringify(localizations, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </Container>
  )
}

// Widget configuration
export const config = defineWidgetConfig({
  zone: "product_category.details.after",
})

export default CategoryLocalizationWidget