import os

def patch_admin():
    path = 'E:/demo/executive-schedule/src/app/admin/schedules/page.tsx'
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 1. Update loadPrintSettings to fetch from API
    old_load = """const loadPrintSettings = () => {
    const saved = localStorage.getItem('printSettings')
    if (saved) {
      try {
        const config = JSON.parse(saved)"""
        
    new_load = """const loadPrintSettings = async () => {
    try {
      const res = await fetch('/api/settings?key=printSettings');
      if (res.ok) {
        const data = await res.json();
        if (data.value) {
          const config = JSON.parse(data.value);"""
    content = content.replace(old_load, new_load)
    
    # 2. Fix the catch block for loadPrintSettings
    old_load_catch = """      } catch (e) {
        console.error("Error loading print settings", e)
      }
    } else {
      // Fallback
      const savedFont = localStorage.getItem('printFontFamily')"""
      
    new_load_catch = """      } catch (e) {
        console.error("Error parsing print settings", e)
      }
      }
    } catch (e) {
      console.error("Error fetching print settings", e)
    }
    
    // Also try local storage as fallback
    const saved = localStorage.getItem('printSettings')
    if (saved) {
      // Fallback logic
      const savedFont = localStorage.getItem('printFontFamily')"""
    content = content.replace(old_load_catch, new_load_catch)
    
    # 3. Update useEffect
    old_effect = """useEffect(() => {
    fetchExecutives()
    loadPrintSettings()
    fetchSuggestions()
  }, [])"""
    new_effect = """useEffect(() => {
    fetchExecutives()
    loadPrintSettings()
    fetchSuggestions()
  }, [])"""
    # no change to useEffect

    # 4. Update savePrintSettings (trigger formatting update)
    # Actually wait, there is no `savePrintSettings` function, the admin saves in a `useEffect`!
    
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

def patch_public():
    pass

if __name__ == '__main__':
    patch_admin()
